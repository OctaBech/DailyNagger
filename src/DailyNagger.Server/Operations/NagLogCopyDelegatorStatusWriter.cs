using DailyNagger.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Operations;

public interface INagLogCopyDelegatorStatusWriter
{
    Task RecordStartedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset startedAt,
        CancellationToken cancellationToken = default);

    Task RecordSnapshotAsync(
        NagLogCopyDelegatorStatusSnapshot snapshot,
        CancellationToken cancellationToken = default);

    Task RecordFailedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset failedAt,
        Guid? communityId = null,
        CancellationToken cancellationToken = default);

    Task RecordStoppedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset stoppedAt,
        CancellationToken cancellationToken = default);
}

public sealed class NagLogCopyDelegatorStatusWriter(DailyNaggerControlDbContext db) : INagLogCopyDelegatorStatusWriter
{
    public async Task RecordStartedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset startedAt,
        CancellationToken cancellationToken = default)
    {
        var status = await GetOrCreateAsync(
            delegatorId,
            delegatorName,
            startedAt,
            cancellationToken);

        status.DelegatorName = delegatorName;
        status.Status = NagLogCopyDelegatorStatusState.Running;
        status.StartedAt = startedAt;
        status.LastSeenAt = startedAt;
        status.StoppedAt = null;
        status.LastErrorAt = null;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordSnapshotAsync(
        NagLogCopyDelegatorStatusSnapshot snapshot,
        CancellationToken cancellationToken = default)
    {
        var status = await GetOrCreateAsync(
            snapshot.DelegatorId,
            snapshot.DelegatorName,
            snapshot.SeenAt,
            cancellationToken);

        var dbDurationMs = ToMilliseconds(snapshot.DbDuration);
        var processingDurationMs = ToMilliseconds(snapshot.ProcessingDuration);

        status.DelegatorName = snapshot.DelegatorName;
        status.CommunityId = snapshot.CommunityId;
        status.Status = NagLogCopyDelegatorStatusState.Running;
        status.LastSeenAt = snapshot.SeenAt;
        status.LastRunStartedAt = snapshot.LastRunStartedAt;
        status.LastRunFinishedAt = snapshot.LastRunFinishedAt;
        status.LastRunDurationMs = ToMilliseconds(snapshot.LastRunFinishedAt - snapshot.LastRunStartedAt);
        status.LastRunMaxParallelism = snapshot.LastRunMaxParallelism;
        status.TotalRunCount += snapshot.CompletedRunCount;
        status.TotalCopiedCount += snapshot.CopiedCount;
        status.TotalStaleCount += snapshot.StaleCount;
        status.TotalNoFutureOccurrenceCount += snapshot.NoFutureOccurrenceCount;
        status.TotalNoOpenLogCount += snapshot.NoOpenLogCount;
        status.TotalErrorCount += snapshot.ErrorCount;
        status.ErrorCountSinceLastSnapshot = snapshot.ErrorCount;
        status.TotalDbDurationMs += dbDurationMs;
        status.TotalProcessingDurationMs += processingDurationMs;
        status.MaxDbDurationMs = Math.Max(status.MaxDbDurationMs, dbDurationMs);
        status.MaxProcessingDurationMs = Math.Max(status.MaxProcessingDurationMs, processingDurationMs);
        status.LastDbDurationMs = dbDurationMs;
        status.LastProcessingDurationMs = processingDurationMs;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordFailedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset failedAt,
        Guid? communityId = null,
        CancellationToken cancellationToken = default)
    {
        var status = await GetOrCreateAsync(
            delegatorId,
            delegatorName,
            failedAt,
            cancellationToken);

        status.DelegatorName = delegatorName;
        status.CommunityId = communityId;
        status.Status = NagLogCopyDelegatorStatusState.Failed;
        status.LastSeenAt = failedAt;
        status.LastErrorAt = failedAt;
        status.TotalErrorCount++;
        status.ErrorCountSinceLastSnapshot++;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordStoppedAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset stoppedAt,
        CancellationToken cancellationToken = default)
    {
        var status = await GetOrCreateAsync(
            delegatorId,
            delegatorName,
            stoppedAt,
            cancellationToken);

        status.DelegatorName = delegatorName;
        status.Status = NagLogCopyDelegatorStatusState.Stopped;
        status.LastSeenAt = stoppedAt;
        status.StoppedAt = stoppedAt;

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<NagLogCopyDelegatorStatus> GetOrCreateAsync(
        Guid delegatorId,
        string delegatorName,
        DateTimeOffset timestamp,
        CancellationToken cancellationToken)
    {
        var status = await db.NagLogCopyDelegatorStatuses.SingleOrDefaultAsync(
            item => item.DelegatorId == delegatorId,
            cancellationToken);

        if (status is not null)
        {
            return status;
        }

        status = new NagLogCopyDelegatorStatus
        {
            DelegatorId = delegatorId,
            DelegatorName = delegatorName,
            Status = NagLogCopyDelegatorStatusState.Starting,
            StartedAt = timestamp,
            LastSeenAt = timestamp
        };

        db.NagLogCopyDelegatorStatuses.Add(status);

        return status;
    }

    private static long ToMilliseconds(TimeSpan duration)
    {
        if (duration < TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(duration), duration, "Duration must not be negative.");
        }

        return Convert.ToInt64(duration.TotalMilliseconds);
    }
}
