using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Tests.Operations;

public sealed class NagCopyDelegatorLoopTests
{
    [Fact]
    public async Task RunUntilCancelledAsync_delays_remaining_interval_after_short_run()
    {
        var communityId = Guid.NewGuid();
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var requestedDelays = new List<TimeSpan>();
        using var cancellation = new CancellationTokenSource();

        var loop = new NagCopyDelegatorLoop(
            _ => CreateDelegator(() =>
            {
                now = now.AddMinutes(2);
            }),
            () => now,
            (delay, _) =>
            {
                requestedDelays.Add(delay);
                cancellation.Cancel();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.FromMinutes(15)
            }),
            new ListLogger<NagCopyDelegatorLoop>());

        await loop.RunUntilCancelledAsync(
            communityId,
            cancellation.Token);

        var delay = Assert.Single(requestedDelays);
        Assert.Equal(TimeSpan.FromMinutes(13), delay);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_starts_next_run_immediately_when_run_exceeds_interval()
    {
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var runCount = 0;
        var delayCount = 0;
        using var cancellation = new CancellationTokenSource();

        var loop = new NagCopyDelegatorLoop(
            _ => CreateDelegator(() =>
            {
                runCount++;

                if (runCount == 1)
                {
                    now = now.AddMinutes(20);
                }
                else
                {
                    cancellation.Cancel();
                }
            }),
            () => now,
            (_, _) =>
            {
                delayCount++;

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.FromMinutes(15)
            }),
            new ListLogger<NagCopyDelegatorLoop>());

        await loop.RunUntilCancelledAsync(
            Guid.NewGuid(),
            cancellation.Token);

        Assert.Equal(2, runCount);
        Assert.Equal(0, delayCount);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_logs_delegator_failure_and_continues_to_delay()
    {
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var exception = new InvalidOperationException("reader failed");
        var logger = new ListLogger<NagCopyDelegatorLoop>();
        var requestedDelays = new List<TimeSpan>();
        using var cancellation = new CancellationTokenSource();

        var loop = new NagCopyDelegatorLoop(
            _ => new NagCopyDelegator(
                (_, _, _, _) => throw exception,
                (_, _) => Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied)),
                new NagCopyDelegatorOptions(1)),
            () => now,
            (delay, _) =>
            {
                requestedDelays.Add(delay);
                cancellation.Cancel();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.FromMinutes(15)
            }),
            logger);

        await loop.RunUntilCancelledAsync(
            Guid.NewGuid(),
            cancellation.Token);

        var entry = Assert.Single(logger.Entries);
        Assert.Equal(LogLevel.Error, entry.Level);
        Assert.Same(exception, entry.Exception);
        Assert.Contains("Nag copy delegator run failed", entry.Message);
        Assert.Equal(TimeSpan.FromMinutes(15), Assert.Single(requestedDelays));
    }

    [Fact]
    public async Task RunUntilCancelledAsync_passes_current_copy_grace_period_to_delegator()
    {
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var requestedGracePeriods = new List<TimeSpan>();
        using var cancellation = new CancellationTokenSource();
        var options = new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
        {
            DelegatorInterval = TimeSpan.FromMinutes(15),
            CopyGracePeriod = TimeSpan.FromMinutes(10)
        });

        var loop = new NagCopyDelegatorLoop(
            _ => new NagCopyDelegator(
                (_, _, gracePeriod, _) =>
                {
                    requestedGracePeriods.Add(gracePeriod);

                    return Task.FromResult<IReadOnlyList<LapsedNag>>([]);
                },
                (_, _) => Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied)),
                new NagCopyDelegatorOptions(1)),
            () => now,
            (_, _) =>
            {
                if (requestedGracePeriods.Count == 1)
                {
                    options.CurrentValue = new NagCopyWorkerOptions
                    {
                        DelegatorInterval = TimeSpan.FromMinutes(15),
                        CopyGracePeriod = TimeSpan.FromMinutes(2)
                    };

                    return Task.CompletedTask;
                }

                cancellation.Cancel();

                return Task.CompletedTask;
            },
            options,
            new ListLogger<NagCopyDelegatorLoop>());

        await loop.RunUntilCancelledAsync(
            Guid.NewGuid(),
            cancellation.Token);

        Assert.Equal(
            [TimeSpan.FromMinutes(10), TimeSpan.FromMinutes(2)],
            requestedGracePeriods);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_reads_current_interval_for_each_iteration()
    {
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var runCount = 0;
        var requestedDelays = new List<TimeSpan>();
        using var cancellation = new CancellationTokenSource();
        var options = new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
        {
            DelegatorInterval = TimeSpan.FromMinutes(15)
        });

        var loop = new NagCopyDelegatorLoop(
            _ => CreateDelegator(() =>
            {
                runCount++;
                now = now.AddMinutes(1);
            }),
            () => now,
            (delay, _) =>
            {
                requestedDelays.Add(delay);

                if (requestedDelays.Count == 1)
                {
                    options.CurrentValue = new NagCopyWorkerOptions
                    {
                        DelegatorInterval = TimeSpan.FromMinutes(5)
                    };

                    return Task.CompletedTask;
                }

                cancellation.Cancel();

                return Task.CompletedTask;
            },
            options,
            new ListLogger<NagCopyDelegatorLoop>());

        await loop.RunUntilCancelledAsync(
            Guid.NewGuid(),
            cancellation.Token);

        Assert.Equal(2, runCount);
        Assert.Equal(
            [TimeSpan.FromMinutes(14), TimeSpan.FromMinutes(4)],
            requestedDelays);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_rejects_invalid_interval()
    {
        var loop = new NagCopyDelegatorLoop(
            _ => CreateDelegator(() => { }),
            () => DateTimeOffset.UtcNow,
            (_, _) => Task.CompletedTask,
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.Zero
            }),
            new ListLogger<NagCopyDelegatorLoop>());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => loop.RunUntilCancelledAsync(
                Guid.NewGuid(),
                CancellationToken.None));

        Assert.Contains("interval", exception.Message);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_does_not_cancel_current_run_when_scheduling_is_stopped()
    {
        using var schedulingCancellation = new CancellationTokenSource();
        using var workerCancellation = new CancellationTokenSource();
        var runTokenWasCancelled = true;

        var loop = new NagCopyDelegatorLoop(
            _ => new NagCopyDelegator(
                (_, _, _, token) =>
                {
                    schedulingCancellation.Cancel();
                    runTokenWasCancelled = token.IsCancellationRequested;

                    return Task.FromResult<IReadOnlyList<LapsedNag>>([]);
                },
                (_, _) => Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied)),
                new NagCopyDelegatorOptions(1)),
            () => DateTimeOffset.UtcNow,
            (_, _) => Task.CompletedTask,
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.FromMinutes(15)
            }),
            new ListLogger<NagCopyDelegatorLoop>());

        await loop.RunUntilCancelledAsync(
            Guid.NewGuid(),
            schedulingCancellation.Token,
            workerCancellation.Token);

        Assert.False(runTokenWasCancelled);
    }

    [Fact]
    public async Task RunUntilCancelledAsync_records_delegator_status_snapshot_for_run()
    {
        var communityId = Guid.NewGuid();
        var delegatorId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var now = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var statusWriter = new FakeNagLogCopyDelegatorStatusWriter();
        using var cancellation = new CancellationTokenSource();

        var loop = new NagCopyDelegatorLoop(
            _ => new NagCopyDelegator(
                (_, _, _, _) =>
                {
                    now = now.AddSeconds(5);

                    return Task.FromResult<IReadOnlyList<LapsedNag>>(
                    [
                        new LapsedNag(Guid.NewGuid(), new DateOnly(2026, 6, 7)),
                        new LapsedNag(Guid.NewGuid(), new DateOnly(2026, 6, 7))
                    ]);
                },
                (_, _) =>
                {
                    now = now.AddSeconds(2);

                    return Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied));
                },
                new NagCopyDelegatorOptions(2)),
            () => now,
            (_, _) =>
            {
                cancellation.Cancel();

                return Task.CompletedTask;
            },
            new TestOptionsMonitor<NagCopyWorkerOptions>(new NagCopyWorkerOptions
            {
                DelegatorInterval = TimeSpan.FromMinutes(15)
            }),
            new ListLogger<NagCopyDelegatorLoop>(),
            statusWriter,
            () => delegatorId);

        await loop.RunUntilCancelledAsync(
            communityId,
            cancellation.Token);

        var snapshot = Assert.Single(statusWriter.Snapshots);

        Assert.Equal(delegatorId, snapshot.DelegatorId);
        Assert.Equal(NagCopyDelegatorLoop.DelegatorName, snapshot.DelegatorName);
        Assert.Equal(communityId, snapshot.CommunityId);
        Assert.Equal(1, snapshot.CompletedRunCount);
        Assert.Equal(2, snapshot.CopiedCount);
        Assert.Equal(0, snapshot.ErrorCount);
        Assert.Equal(2, snapshot.LastRunMaxParallelism);
        Assert.True(snapshot.LastRunFinishedAt > snapshot.LastRunStartedAt);
    }

    private static NagCopyDelegator CreateDelegator(Action onRun) =>
        new(
            (_, _, _, _) =>
            {
                onRun();

                return Task.FromResult<IReadOnlyList<LapsedNag>>([]);
            },
            (_, _) => Task.FromResult(NagCopyWorkerRunResult.FromStatus(CopyLapsedNagLogStatus.Copied)),
            new NagCopyDelegatorOptions(1));

    private sealed class FakeNagLogCopyDelegatorStatusWriter : INagLogCopyDelegatorStatusWriter
    {
        public List<NagLogCopyDelegatorStatusSnapshot> Snapshots { get; } = [];
        public List<FailedRecord> Failed { get; } = [];

        public Task RecordStartedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset startedAt,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RecordSnapshotAsync(
            NagLogCopyDelegatorStatusSnapshot snapshot,
            CancellationToken cancellationToken = default)
        {
            Snapshots.Add(snapshot);

            return Task.CompletedTask;
        }

        public Task RecordFailedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset failedAt,
            Guid? communityId = null,
            CancellationToken cancellationToken = default)
        {
            Failed.Add(new FailedRecord(delegatorId, delegatorName, failedAt));

            return Task.CompletedTask;
        }

        public Task RecordStoppedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset stoppedAt,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed record FailedRecord(
        Guid DelegatorId,
        string DelegatorName,
        DateTimeOffset FailedAt);

    private sealed class ListLogger<T> : ILogger<T>
    {
        public List<LogEntry> Entries { get; } = [];

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
            Entries.Add(new LogEntry(
                logLevel,
                formatter(state, exception),
                exception));
        }
    }

    private sealed record LogEntry(
        LogLevel Level,
        string Message,
        Exception? Exception);
}
