using DailyNagger.Server.Domain;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Operations;

public static class NagCopyWorkerLog
{
    public static void Copied(
        ILogger logger,
        Guid nagId,
        Guid oldNagLogId,
        Guid newNagLogId,
        DateOnly oldActiveLogDueOn,
        DateOnly newActiveLogDueOn)
    {
        logger.LogInformation(
            "Copied NagLog. NagId={NagId} OldNagLogId={OldNagLogId} NewNagLogId={NewNagLogId} OldActiveLogDueOn={OldActiveLogDueOn} NewActiveLogDueOn={NewActiveLogDueOn}",
            nagId,
            oldNagLogId,
            newNagLogId,
            oldActiveLogDueOn,
            newActiveLogDueOn);
    }

    public static void Stale(
        ILogger logger,
        Guid nagId,
        DateOnly expectedActiveLogDueOn)
    {
        logger.LogDebug(
            "Skipped stale NagLog copy. NagId={NagId} ExpectedActiveLogDueOn={ExpectedActiveLogDueOn}",
            nagId,
            expectedActiveLogDueOn);
    }

    public static void NoFutureOccurrence(
        ILogger logger,
        Guid nagId,
        Guid oldNagLogId,
        DateOnly oldActiveLogDueOn)
    {
        logger.LogWarning(
            "Closed lapsed NagLog without creating a new copy because no future occurrence could be calculated. NagId={NagId} OldNagLogId={OldNagLogId} OldActiveLogDueOn={OldActiveLogDueOn}",
            nagId,
            oldNagLogId,
            oldActiveLogDueOn);
    }

    public static void NoOpenLog(
        ILogger logger,
        Guid nagId,
        DateOnly expectedActiveLogDueOn)
    {
        logger.LogError(
            "Cannot copy lapsed Nag because no open NagLog exists. NagId={NagId} ExpectedActiveLogDueOn={ExpectedActiveLogDueOn}",
            nagId,
            expectedActiveLogDueOn);
    }

    public static void Failed(
        ILogger logger,
        Exception exception,
        Guid nagId,
        DateOnly expectedActiveLogDueOn)
    {
        logger.LogError(
            exception,
            "Failed to copy lapsed NagLog. NagId={NagId} ExpectedActiveLogDueOn={ExpectedActiveLogDueOn}",
            nagId,
            expectedActiveLogDueOn);
    }

    public static void LogResult(
        ILogger logger,
        CopyLapsedNagLogResult result,
        DateOnly expectedActiveLogDueOn)
    {
        switch (result.Status)
        {
            case CopyLapsedNagLogStatus.Copied:
                Copied(
                    logger,
                    result.NagId,
                    result.OldNagLogId ?? throw new InvalidOperationException("Copied result requires OldNagLogId."),
                    result.NewNagLogId ?? throw new InvalidOperationException("Copied result requires NewNagLogId."),
                    expectedActiveLogDueOn,
                    result.ActiveLogDueOn ?? throw new InvalidOperationException("Copied result requires ActiveLogDueOn."));
                break;

            case CopyLapsedNagLogStatus.Stale:
                Stale(logger, result.NagId, expectedActiveLogDueOn);
                break;

            case CopyLapsedNagLogStatus.NoFutureOccurrence:
                NoFutureOccurrence(
                    logger,
                    result.NagId,
                    result.OldNagLogId ?? throw new InvalidOperationException("NoFutureOccurrence result requires OldNagLogId."),
                    expectedActiveLogDueOn);
                break;

            case CopyLapsedNagLogStatus.NoOpenLog:
                NoOpenLog(logger, result.NagId, expectedActiveLogDueOn);
                break;

            default:
                throw new ArgumentOutOfRangeException(nameof(result), result.Status, null);
        }
    }
}
