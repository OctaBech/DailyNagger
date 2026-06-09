using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Operations;

public sealed class NagCopyWorker(
    ICopyLapsedNagLogCommandHandler commandHandler,
    ILogger<NagCopyWorker> logger)
{
    public const string WorkerName = nameof(NagCopyWorker);

    public async Task<NagCopyWorkerRunResult> RunAsync(
        CopyLapsedNagLogCommand command,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await commandHandler.CopyLapsedNagLogAsync(
                command.CommunityId,
                command.NagId,
                command.ExpectedActiveLogDueOn,
                command.Today,
                command.ClosedOn,
                cancellationToken);

            NagCopyWorkerLog.LogResult(
                logger,
                result,
                command.ExpectedActiveLogDueOn);

            return NagCopyWorkerRunResult.FromStatus(result.Status);
        }
        catch (Exception exception)
        {
            NagCopyWorkerLog.Failed(
                logger,
                exception,
                command.NagId,
                command.ExpectedActiveLogDueOn);

            return NagCopyWorkerRunResult.Failure;
        }
    }
}
