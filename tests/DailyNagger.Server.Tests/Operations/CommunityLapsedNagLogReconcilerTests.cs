using DailyNagger.Server.Operations;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Tests.Operations;

public sealed class CommunityLapsedNagLogReconcilerTests
{
    [Fact]
    public async Task ReconcileOnceAsync_starts_loops_for_new_active_communities()
    {
        var communityA = Guid.NewGuid();
        var communityB = Guid.NewGuid();
        var started = new List<Guid>();
        var activeCommunities = new List<Guid> { communityA, communityB };
        var reconciler = CreateReconciler(
            _ => Task.FromResult<IReadOnlyList<Guid>>(activeCommunities),
            communityId =>
            {
                started.Add(communityId);

                return new RunningCommunityLapsedNagLogLoop(Task.CompletedTask, () => { });
            });

        await reconciler.ReconcileOnceAsync();

        Assert.Equal(2, started.Count);
        Assert.Contains(communityA, started);
        Assert.Contains(communityB, started);
    }

    [Fact]
    public async Task ReconcileOnceAsync_stops_removed_communities_and_starts_new_communities()
    {
        var communityA = Guid.NewGuid();
        var communityB = Guid.NewGuid();
        var communityC = Guid.NewGuid();
        var stopped = new List<Guid>();
        var activeCommunities = new List<Guid> { communityA, communityB };
        var reconciler = CreateReconciler(
            _ => Task.FromResult<IReadOnlyList<Guid>>(activeCommunities),
            communityId => new RunningCommunityLapsedNagLogLoop(
                Task.CompletedTask,
                () => stopped.Add(communityId)));

        await reconciler.ReconcileOnceAsync();

        activeCommunities = [communityA, communityC];

        await reconciler.ReconcileOnceAsync();

        Assert.Equal([communityB], stopped);
        Assert.Equal(2, reconciler.RunningCommunityIds.Count);
        Assert.Contains(communityA, reconciler.RunningCommunityIds);
        Assert.Contains(communityC, reconciler.RunningCommunityIds);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_delays_remaining_refresh_interval_after_reconcile()
    {
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var delays = new List<TimeSpan>();
        using var cancellation = new CancellationTokenSource();
        var reconciler = new CommunityLapsedNagLogReconciler(
            _ =>
            {
                now = now.AddMinutes(1);

                return Task.FromResult<IReadOnlyList<Guid>>([]);
            },
            _ => new RunningCommunityLapsedNagLogLoop(Task.CompletedTask, () => { }),
            () => now,
            (delay, _) =>
            {
                delays.Add(delay);
                cancellation.Cancel();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                CommunityRefreshInterval = TimeSpan.FromMinutes(5)
            }),
            new ListLogger<CommunityLapsedNagLogReconciler>());

        await reconciler.RunUntilCancelledAsync(cancellation.Token);

        Assert.Equal(TimeSpan.FromMinutes(4), Assert.Single(delays));
    }

    [Fact]
    public async Task RunUntilCancelledAsync_stops_running_loops_when_cancelled_during_delay()
    {
        var communityId = Guid.NewGuid();
        var stopped = false;
        using var cancellation = new CancellationTokenSource();
        var reconciler = new CommunityLapsedNagLogReconciler(
            _ => Task.FromResult<IReadOnlyList<Guid>>([communityId]),
            _ => new RunningCommunityLapsedNagLogLoop(
                Task.CompletedTask,
                () => stopped = true),
            () => DateTimeOffset.UtcNow,
            (_, _) =>
            {
                cancellation.Cancel();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                CommunityRefreshInterval = TimeSpan.FromMinutes(5)
            }),
            new ListLogger<CommunityLapsedNagLogReconciler>());

        await reconciler.RunUntilCancelledAsync(cancellation.Token);

        Assert.True(stopped);
    }

    private static CommunityLapsedNagLogReconciler CreateReconciler(
        Func<CancellationToken, Task<IReadOnlyList<Guid>>> getActiveCommunityIdsAsync,
        Func<Guid, RunningCommunityLapsedNagLogLoop> startLoop) =>
        new(
            getActiveCommunityIdsAsync,
            startLoop,
            () => DateTimeOffset.UtcNow,
            (_, _) => Task.CompletedTask,
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                CommunityRefreshInterval = TimeSpan.FromMinutes(5)
            }),
            new ListLogger<CommunityLapsedNagLogReconciler>());

    private sealed class ListLogger<T> : ILogger<T>
    {
        public IDisposable? BeginScope<TState>(TState state)
            where TState : notnull =>
            null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
        }
    }
}
