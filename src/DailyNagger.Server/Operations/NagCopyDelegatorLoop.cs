using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DailyNagger.Server.Operations;

public sealed class NagCopyDelegatorLoop(
    Func<Guid, NagCopyDelegator> createDelegator,
    Func<DateTimeOffset> getNow,
    Func<TimeSpan, CancellationToken, Task> delayAsync,
    IOptionsMonitor<NagCopyWorkerOptions> optionsMonitor,
    ILogger<NagCopyDelegatorLoop> logger,
    INagLogCopyDelegatorStatusWriter? statusWriter = null,
    Func<Guid>? createDelegatorId = null)
{
    public const string DelegatorName = nameof(NagCopyDelegatorLoop);

    private readonly Guid delegatorId = (createDelegatorId ?? Guid.NewGuid)();

    public async Task RunUntilCancelledAsync(
        Guid communityId,
        CancellationToken cancellationToken) =>
        await RunUntilCancelledAsync(
            communityId,
            cancellationToken,
            cancellationToken);

    public async Task RunUntilCancelledAsync(
        Guid communityId,
        CancellationToken schedulingCancellationToken,
        CancellationToken workerCancellationToken)
    {
        while (!schedulingCancellationToken.IsCancellationRequested)
        {
            var options = optionsMonitor.CurrentValue;

            if (options.DelegatorInterval <= TimeSpan.Zero)
            {
                throw new InvalidOperationException("Nag copy delegator loop interval must be greater than 0.");
            }

            var startedAt = getNow();

            try
            {
                var result = await createDelegator(communityId).RunOnceAsync(
                    communityId,
                    DateOnly.FromDateTime(startedAt.DateTime),
                    startedAt,
                    options.CopyGracePeriod,
                    workerCancellationToken);

                var finishedAt = getNow();

                await TryRecordSnapshotAsync(
                    communityId,
                    startedAt,
                    finishedAt,
                    result,
                    schedulingCancellationToken);
            }
            catch (OperationCanceledException) when (schedulingCancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Nag copy delegator run failed. CommunityId={CommunityId}",
                    communityId);

                await TryRecordFailedAsync(
                    communityId,
                    getNow(),
                    schedulingCancellationToken);
            }

            if (schedulingCancellationToken.IsCancellationRequested)
            {
                return;
            }

            var elapsed = getNow() - startedAt;
            var delay = options.DelegatorInterval - elapsed;

            if (delay <= TimeSpan.Zero)
            {
                continue;
            }

            try
            {
                    await delayAsync(delay, schedulingCancellationToken);
                }
                catch (OperationCanceledException) when (schedulingCancellationToken.IsCancellationRequested)
                {
                    return;
                }
        }
    }

    private async Task TryRecordSnapshotAsync(
        Guid communityId,
        DateTimeOffset startedAt,
        DateTimeOffset finishedAt,
        NagCopyDelegatorRunResult result,
        CancellationToken cancellationToken)
    {
        if (statusWriter is null)
        {
            return;
        }

        try
        {
            await statusWriter.RecordSnapshotAsync(
                new NagLogCopyDelegatorStatusSnapshot(
                    delegatorId,
                    DelegatorName,
                    communityId,
                    finishedAt,
                    startedAt,
                    finishedAt,
                    result.MaxParallelism,
                    CompletedRunCount: 1,
                    result.CopiedCount,
                    result.StaleCount,
                    result.NoFutureOccurrenceCount,
                    result.NoOpenLogCount,
                    result.ErrorCount,
                    DbDuration: TimeSpan.Zero,
                    ProcessingDuration: TimeSpan.Zero),
                cancellationToken);
        }
        catch (Exception exception)
        {
            LogStatusWriteFailure(exception);
        }
    }

    private async Task TryRecordFailedAsync(
        Guid communityId,
        DateTimeOffset failedAt,
        CancellationToken cancellationToken)
    {
        if (statusWriter is null)
        {
            return;
        }

        try
        {
            await statusWriter.RecordFailedAsync(
                delegatorId,
                DelegatorName,
                failedAt,
                communityId,
                cancellationToken);
        }
        catch (Exception exception)
        {
            LogStatusWriteFailure(exception);
        }
    }

    private void LogStatusWriteFailure(Exception exception)
    {
        logger.LogWarning(
            exception,
            "Failed to record NagLog copy delegator status. DelegatorId={DelegatorId} DelegatorName={DelegatorName}",
            delegatorId,
            DelegatorName);
    }
}
