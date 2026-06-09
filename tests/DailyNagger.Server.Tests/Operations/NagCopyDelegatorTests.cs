using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Tests.Operations;

public sealed class NagCopyDelegatorTests
{
    [Fact]
    public async Task RunOnceAsync_starts_worker_for_each_lapsed_nag()
    {
        var communityId = Guid.NewGuid();
        var today = new DateOnly(2026, 6, 7);
        var closedOn = DateTimeOffset.UtcNow;
        var copyGracePeriod = TimeSpan.FromMinutes(10);
        DateTimeOffset? requestedNow = null;
        TimeSpan? requestedCopyGracePeriod = null;
        var lapsedNag = new[]
        {
            new LapsedNag(Guid.NewGuid(), today.AddDays(-2)),
            new LapsedNag(Guid.NewGuid(), today.AddDays(-1))
        };
        var commands = new List<CopyLapsedNagLogCommand>();

        var delegator = new NagCopyDelegator(
            (_, now, gracePeriod, _) =>
            {
                requestedNow = now;
                requestedCopyGracePeriod = gracePeriod;

                return Task.FromResult<IReadOnlyList<LapsedNag>>(lapsedNag);
            },
            (command, _) =>
            {
                commands.Add(command);

                return Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied));
            },
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 4));

        var result = await delegator.RunOnceAsync(
            communityId,
            today,
            closedOn,
            copyGracePeriod);

        Assert.Equal(4, result.MaxParallelism);
        Assert.Equal(closedOn, requestedNow);
        Assert.Equal(copyGracePeriod, requestedCopyGracePeriod);
        Assert.Equal(2, result.CopiedCount);
        Assert.Equal(0, result.ErrorCount);
        Assert.Equal(2, commands.Count);
        Assert.Contains(commands, command =>
            command.CommunityId == communityId
            && command.NagId == lapsedNag[0].NagId
            && command.ExpectedActiveLogDueOn == lapsedNag[0].ActiveLogDueOn
            && command.Today == today
            && command.ClosedOn == closedOn);
        Assert.Contains(commands, command =>
            command.CommunityId == communityId
            && command.NagId == lapsedNag[1].NagId
            && command.ExpectedActiveLogDueOn == lapsedNag[1].ActiveLogDueOn
            && command.Today == today
            && command.ClosedOn == closedOn);
    }

    [Fact]
    public async Task RunOnceAsync_respects_max_parallel_copy_workers()
    {
        var today = new DateOnly(2026, 6, 7);
        var lapsedNag = Enumerable
            .Range(0, 5)
            .Select(index => new LapsedNag(Guid.NewGuid(), today.AddDays(-index - 1)))
            .ToArray();
        var running = 0;
        var maxObservedRunning = 0;
        var startedCount = 0;

        var delegator = new NagCopyDelegator(
            (_, _, _, _) => Task.FromResult<IReadOnlyList<LapsedNag>>(lapsedNag),
            async (_, _) =>
            {
                var nowRunning = Interlocked.Increment(ref running);
                Interlocked.Increment(ref startedCount);

                TrackMaxObservedRunning(
                    ref maxObservedRunning,
                    nowRunning);

                await Task.Delay(50);

                Interlocked.Decrement(ref running);

                return NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied);
            },
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 2));

        await delegator.RunOnceAsync(
            Guid.NewGuid(),
            today,
            DateTimeOffset.UtcNow,
            TimeSpan.FromMinutes(10));

        Assert.Equal(5, startedCount);
        Assert.True(maxObservedRunning <= 2);
    }

    [Fact]
    public async Task RunOnceAsync_rejects_invalid_max_parallel_copy_workers()
    {
        var delegator = new NagCopyDelegator(
            (_, _, _, _) => Task.FromResult<IReadOnlyList<LapsedNag>>([]),
            (_, _) => Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied)),
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 0));

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => delegator.RunOnceAsync(
                Guid.NewGuid(),
                new DateOnly(2026, 6, 7),
                DateTimeOffset.UtcNow,
                TimeSpan.FromMinutes(10)));

        Assert.Contains("MaxParallelCopyWorkers", exception.Message);
    }

    [Fact]
    public async Task RunOnceAsync_aggregates_worker_result_counts()
    {
        var today = new DateOnly(2026, 6, 7);
        var statuses = new[]
        {
            CopyLapsedNagLogStatus.Copied,
            CopyLapsedNagLogStatus.Stale,
            CopyLapsedNagLogStatus.NoFutureOccurrence,
            CopyLapsedNagLogStatus.NoOpenLog
        };
        var lapsedNag = statuses
            .Select((_, index) => new LapsedNag(Guid.NewGuid(), today.AddDays(-index - 1)))
            .ToArray();
        var index = 0;

        var delegator = new NagCopyDelegator(
            (_, _, _, _) => Task.FromResult<IReadOnlyList<LapsedNag>>(lapsedNag),
            (_, _) =>
            {
                var status = statuses[Interlocked.Increment(ref index) - 1];

                return Task.FromResult(NagCopyWorkerRunResult.FromStatus(status));
            },
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 4));

        var result = await delegator.RunOnceAsync(
            Guid.NewGuid(),
            today,
            DateTimeOffset.UtcNow,
            TimeSpan.FromMinutes(10));

        Assert.Equal(4, result.MaxParallelism);
        Assert.Equal(1, result.CopiedCount);
        Assert.Equal(1, result.StaleCount);
        Assert.Equal(1, result.NoFutureOccurrenceCount);
        Assert.Equal(1, result.NoOpenLogCount);
        Assert.Equal(0, result.ErrorCount);
    }

    private static void TrackMaxObservedRunning(
        ref int maxObservedRunning,
        int nowRunning)
    {
        while (true)
        {
            var currentMax = Volatile.Read(ref maxObservedRunning);

            if (nowRunning <= currentMax)
            {
                return;
            }

            if (Interlocked.CompareExchange(
                    ref maxObservedRunning,
                    nowRunning,
                    currentMax) == currentMax)
            {
                return;
            }
        }
    }
}
