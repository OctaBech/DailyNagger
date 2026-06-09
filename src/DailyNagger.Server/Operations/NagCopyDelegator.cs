using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Operations;

public sealed record NagCopyDelegatorOptions(
    int MaxParallelCopyWorkers);

public sealed class NagCopyDelegator(
    Func<DateOnly, DateTimeOffset, TimeSpan, CancellationToken, Task<IReadOnlyList<LapsedNag>>> getLapsedNagAsync,
    Func<CopyLapsedNagLogCommand, CancellationToken, Task<NagCopyWorkerRunResult>> runWorkerAsync,
    NagCopyDelegatorOptions options)
{
    public async Task<NagCopyDelegatorRunResult> RunOnceAsync(
        Guid communityId,
        DateOnly today,
        DateTimeOffset closedOn,
        TimeSpan copyGracePeriod,
        CancellationToken cancellationToken = default)
    {
        if (options.MaxParallelCopyWorkers < 1)
        {
            throw new InvalidOperationException("MaxParallelCopyWorkers must be greater than 0.");
        }

        if (copyGracePeriod < TimeSpan.Zero)
        {
            throw new InvalidOperationException("CopyGracePeriod must be 0 or greater.");
        }

        var lapsedNag = await getLapsedNagAsync(
            today,
            closedOn,
            copyGracePeriod,
            cancellationToken);

        using var semaphore = new SemaphoreSlim(options.MaxParallelCopyWorkers);
        var tasks = new List<Task<NagCopyWorkerRunResult>>();

        foreach (var nag in lapsedNag)
        {
            await semaphore.WaitAsync(cancellationToken);

            tasks.Add(RunWorkerAndReleaseAsync(nag));
        }

        var results = await Task.WhenAll(tasks);

        return new NagCopyDelegatorRunResult(
            options.MaxParallelCopyWorkers,
            results.Count(result => result.Status == CopyLapsedNagLogStatus.Copied),
            results.Count(result => result.Status == CopyLapsedNagLogStatus.Stale),
            results.Count(result => result.Status == CopyLapsedNagLogStatus.NoFutureOccurrence),
            results.Count(result => result.Status == CopyLapsedNagLogStatus.NoOpenLog),
            results.Count(result => result.Failed));

        async Task<NagCopyWorkerRunResult> RunWorkerAndReleaseAsync(LapsedNag nag)
        {
            try
            {
                return await runWorkerAsync(
                    new CopyLapsedNagLogCommand(
                        communityId,
                        nag.NagId,
                        nag.ActiveLogDueOn,
                        today,
                        closedOn),
                    cancellationToken);
            }
            finally
            {
                semaphore.Release();
            }
        }
    }
}
