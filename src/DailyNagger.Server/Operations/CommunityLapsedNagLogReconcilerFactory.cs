using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DailyNagger.Server.Operations;

public sealed class CommunityLapsedNagLogReconcilerFactory(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<NagCopyWorkerOptions> optionsMonitor,
    ILoggerFactory loggerFactory)
{
    public CommunityLapsedNagLogReconciler Create(CancellationToken hostCancellationToken) =>
        new(
            GetActiveCommunityIdsAsync,
            communityId => StartCommunityLoop(communityId, hostCancellationToken),
            () => DateTimeOffset.UtcNow,
            Task.Delay,
            optionsMonitor,
            loggerFactory.CreateLogger<CommunityLapsedNagLogReconciler>());

    private async Task<IReadOnlyList<Guid>> GetActiveCommunityIdsAsync(
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var controlDbRead = scope.ServiceProvider.GetRequiredService<ControlDbRead>();

        return await controlDbRead.GetActiveNagCommunityIdsAsync(cancellationToken);
    }

    private RunningCommunityLapsedNagLogLoop StartCommunityLoop(
        Guid communityId,
        CancellationToken hostCancellationToken)
    {
        var schedulingCancellation = CancellationTokenSource.CreateLinkedTokenSource(
            hostCancellationToken);

        var completion = Task.Run(async () =>
        {
            try
            {
                var loop = CreateDelegatorLoop();

                await loop.RunUntilCancelledAsync(
                    communityId,
                    schedulingCancellation.Token,
                    hostCancellationToken);
            }
            finally
            {
                schedulingCancellation.Dispose();
            }
        }, CancellationToken.None);

        return new RunningCommunityLapsedNagLogLoop(
            completion,
            schedulingCancellation.Cancel);
    }

    private NagCopyDelegatorLoop CreateDelegatorLoop() =>
        new(
            CreateDelegator,
            () => DateTimeOffset.UtcNow,
            Task.Delay,
            optionsMonitor,
            loggerFactory.CreateLogger<NagCopyDelegatorLoop>(),
            new ScopedNagLogCopyDelegatorStatusWriter(scopeFactory));

    private NagCopyDelegator CreateDelegator(Guid communityId) =>
        new(
            async (today, now, copyGracePeriod, cancellationToken) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var dataDbRead = scope.ServiceProvider.GetRequiredService<DataDbRead>();

                return await dataDbRead.GetLapsedNagAsync(
                    communityId,
                    today,
                    now,
                    copyGracePeriod,
                    cancellationToken);
            },
            async (command, cancellationToken) =>
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var worker = ActivatorUtilities.CreateInstance<NagCopyWorker>(
                    scope.ServiceProvider);

                return await worker.RunAsync(command, cancellationToken);
            },
            new NagCopyDelegatorOptions(
                optionsMonitor.CurrentValue.MaxParallelCopyWorkers));

    private sealed class ScopedNagLogCopyDelegatorStatusWriter(IServiceScopeFactory scopeFactory) : INagLogCopyDelegatorStatusWriter
    {
        public async Task RecordStartedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset startedAt,
            CancellationToken cancellationToken = default)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var writer = scope.ServiceProvider.GetRequiredService<INagLogCopyDelegatorStatusWriter>();

            await writer.RecordStartedAsync(
                delegatorId,
                delegatorName,
                startedAt,
                cancellationToken);
        }

        public async Task RecordSnapshotAsync(
            NagLogCopyDelegatorStatusSnapshot snapshot,
            CancellationToken cancellationToken = default)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var writer = scope.ServiceProvider.GetRequiredService<INagLogCopyDelegatorStatusWriter>();

            await writer.RecordSnapshotAsync(
                snapshot,
                cancellationToken);
        }

        public async Task RecordFailedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset failedAt,
            Guid? communityId = null,
            CancellationToken cancellationToken = default)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var writer = scope.ServiceProvider.GetRequiredService<INagLogCopyDelegatorStatusWriter>();

            await writer.RecordFailedAsync(
                delegatorId,
                delegatorName,
                failedAt,
                communityId,
                cancellationToken);
        }

        public async Task RecordStoppedAsync(
            Guid delegatorId,
            string delegatorName,
            DateTimeOffset stoppedAt,
            CancellationToken cancellationToken = default)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var writer = scope.ServiceProvider.GetRequiredService<INagLogCopyDelegatorStatusWriter>();

            await writer.RecordStoppedAsync(
                delegatorId,
                delegatorName,
                stoppedAt,
                cancellationToken);
        }
    }
}
