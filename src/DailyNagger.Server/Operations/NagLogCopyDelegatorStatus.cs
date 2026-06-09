using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Operations;

public sealed class NagLogCopyDelegatorStatus
{
    public Guid DelegatorId { get; init; }
    public required string DelegatorName { get; set; }
    public Guid? CommunityId { get; set; }
    public NagLogCopyDelegatorStatusState Status { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
    public DateTimeOffset? StoppedAt { get; set; }
    public DateTimeOffset? LastErrorAt { get; set; }
    public DateTimeOffset? LastRunStartedAt { get; set; }
    public DateTimeOffset? LastRunFinishedAt { get; set; }
    public long LastRunDurationMs { get; set; }
    public int LastRunMaxParallelism { get; set; }
    public long TotalRunCount { get; set; }
    public long TotalCopiedCount { get; set; }
    public long TotalStaleCount { get; set; }
    public long TotalNoFutureOccurrenceCount { get; set; }
    public long TotalNoOpenLogCount { get; set; }
    public long TotalErrorCount { get; set; }
    public long ErrorCountSinceLastSnapshot { get; set; }
    public long TotalDbDurationMs { get; set; }
    public long TotalProcessingDurationMs { get; set; }
    public long MaxDbDurationMs { get; set; }
    public long MaxProcessingDurationMs { get; set; }
    public long LastDbDurationMs { get; set; }
    public long LastProcessingDurationMs { get; set; }
}

public enum NagLogCopyDelegatorStatusState
{
    Starting,
    Running,
    Stopping,
    Stopped,
    Failed
}

public sealed record NagLogCopyDelegatorStatusSnapshot(
    Guid DelegatorId,
    string DelegatorName,
    Guid? CommunityId,
    DateTimeOffset SeenAt,
    DateTimeOffset LastRunStartedAt,
    DateTimeOffset LastRunFinishedAt,
    int LastRunMaxParallelism,
    long CompletedRunCount,
    long CopiedCount,
    long StaleCount,
    long NoFutureOccurrenceCount,
    long NoOpenLogCount,
    long ErrorCount,
    TimeSpan DbDuration,
    TimeSpan ProcessingDuration);

public sealed record NagCopyWorkerRunResult(
    CopyLapsedNagLogStatus? Status,
    bool Failed)
{
    public static NagCopyWorkerRunResult FromStatus(CopyLapsedNagLogStatus status) =>
        new(status, Failed: false);

    public static NagCopyWorkerRunResult Failure { get; } = new(null, Failed: true);
}

public sealed record NagCopyDelegatorRunResult(
    int MaxParallelism,
    long CopiedCount,
    long StaleCount,
    long NoFutureOccurrenceCount,
    long NoOpenLogCount,
    long ErrorCount);
