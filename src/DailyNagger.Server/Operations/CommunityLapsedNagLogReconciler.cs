using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DailyNagger.Server.Operations;

public sealed record RunningCommunityLapsedNagLogLoop(
    Task Completion,
    Action RequestStop);

public sealed class CommunityLapsedNagLogReconciler(
    Func<CancellationToken, Task<IReadOnlyList<Guid>>> getActiveCommunityIdsAsync,
    Func<Guid, RunningCommunityLapsedNagLogLoop> startLoop,
    Func<DateTimeOffset> getNow,
    Func<TimeSpan, CancellationToken, Task> delayAsync,
    IOptionsMonitor<NagCopyWorkerOptions> optionsMonitor,
    ILogger<CommunityLapsedNagLogReconciler> logger)
{
    private readonly Dictionary<Guid, RunningCommunityLapsedNagLogLoop> runningLoops = [];

    public IReadOnlyCollection<Guid> RunningCommunityIds => runningLoops.Keys.ToArray();

    public async Task RunUntilCancelledAsync(CancellationToken cancellationToken)
    {
        try
        {
            while (!cancellationToken.IsCancellationRequested)
            {
                var options = optionsMonitor.CurrentValue;

                if (options.CommunityRefreshInterval <= TimeSpan.Zero)
                {
                    throw new InvalidOperationException(
                        "Community lapsed NagLog reconciler refresh interval must be greater than 0.");
                }

                var startedAt = getNow();

                try
                {
                    await ReconcileOnceAsync(cancellationToken);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception)
                {
                    logger.LogError(
                        exception,
                        "Community lapsed NagLog reconciliation failed.");
                }

                if (cancellationToken.IsCancellationRequested)
                {
                    return;
                }

                var delay = options.CommunityRefreshInterval - (getNow() - startedAt);

                if (delay <= TimeSpan.Zero)
                {
                    continue;
                }

                try
                {
                    await delayAsync(delay, cancellationToken);
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
                {
                    return;
                }
            }
        }
        finally
        {
            StopAll();
        }
    }

    public async Task ReconcileOnceAsync(CancellationToken cancellationToken = default)
    {
        var activeCommunityIds = (await getActiveCommunityIdsAsync(cancellationToken))
            .ToHashSet();

        foreach (var communityId in runningLoops.Keys.Except(activeCommunityIds).ToArray())
        {
            runningLoops[communityId].RequestStop();
            runningLoops.Remove(communityId);
        }

        foreach (var communityId in activeCommunityIds.Except(runningLoops.Keys).OrderBy(id => id))
        {
            runningLoops.Add(communityId, startLoop(communityId));
        }
    }

    private void StopAll()
    {
        foreach (var runningLoop in runningLoops.Values)
        {
            runningLoop.RequestStop();
        }

        runningLoops.Clear();
    }
}
