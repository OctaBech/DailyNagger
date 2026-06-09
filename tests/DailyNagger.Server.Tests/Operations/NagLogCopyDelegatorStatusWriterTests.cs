using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Tests.Operations;

[Collection(SqlServerTestCollection.Name)]
public sealed class NagLogCopyDelegatorStatusWriterTests(SqlServerTestFixture fixture) : SqlServerTestBase(fixture)
{
    [Fact]
    public async Task RecordStartedAsync_records_running_delegator_identity()
    {
        await using var db = CreateControlDbContext();
        var writer = new NagLogCopyDelegatorStatusWriter(db);
        var delegatorId = Guid.NewGuid();
        var startedAt = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);

        await writer.RecordStartedAsync(
            delegatorId,
            "NagCopyDelegatorLoop",
            startedAt);

        var status = await db.NagLogCopyDelegatorStatuses.SingleAsync(item => item.DelegatorId == delegatorId);

        Assert.Equal("NagCopyDelegatorLoop", status.DelegatorName);
        Assert.Equal(NagLogCopyDelegatorStatusState.Running, status.Status);
        Assert.Equal(startedAt, status.StartedAt);
        Assert.Equal(startedAt, status.LastSeenAt);
        Assert.Null(status.StoppedAt);
        Assert.Null(status.LastErrorAt);
    }

    [Fact]
    public async Task RecordSnapshotAsync_accumulates_run_error_and_duration_metrics()
    {
        await using var db = CreateControlDbContext();
        var writer = new NagLogCopyDelegatorStatusWriter(db);
        var delegatorId = Guid.NewGuid();
        var startedAt = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);

        await writer.RecordStartedAsync(
            delegatorId,
            "NagCopyDelegatorLoop",
            startedAt);

        await writer.RecordSnapshotAsync(new NagLogCopyDelegatorStatusSnapshot(
            delegatorId,
            "NagCopyDelegatorLoop",
            CommunityId: Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            startedAt.AddMinutes(1),
            LastRunStartedAt: startedAt,
            LastRunFinishedAt: startedAt.AddMinutes(1),
            LastRunMaxParallelism: 2,
            2,
            CopiedCount: 1,
            StaleCount: 1,
            NoFutureOccurrenceCount: 0,
            NoOpenLogCount: 0,
            1,
            TimeSpan.FromMilliseconds(150),
            TimeSpan.FromMilliseconds(25)));

        await writer.RecordSnapshotAsync(new NagLogCopyDelegatorStatusSnapshot(
            delegatorId,
            "NagCopyDelegatorLoop",
            CommunityId: Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            startedAt.AddMinutes(2),
            LastRunStartedAt: startedAt.AddMinutes(1),
            LastRunFinishedAt: startedAt.AddMinutes(2),
            LastRunMaxParallelism: 4,
            1,
            CopiedCount: 1,
            StaleCount: 0,
            NoFutureOccurrenceCount: 0,
            NoOpenLogCount: 0,
            0,
            TimeSpan.FromMilliseconds(30),
            TimeSpan.FromMilliseconds(40)));

        var status = await db.NagLogCopyDelegatorStatuses.SingleAsync(item => item.DelegatorId == delegatorId);

        Assert.Equal(NagLogCopyDelegatorStatusState.Running, status.Status);
        Assert.Equal(Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), status.CommunityId);
        Assert.Equal(startedAt.AddMinutes(1), status.LastRunStartedAt);
        Assert.Equal(startedAt.AddMinutes(2), status.LastRunFinishedAt);
        Assert.Equal(60000, status.LastRunDurationMs);
        Assert.Equal(4, status.LastRunMaxParallelism);
        Assert.Equal(3, status.TotalRunCount);
        Assert.Equal(2, status.TotalCopiedCount);
        Assert.Equal(1, status.TotalStaleCount);
        Assert.Equal(0, status.TotalNoFutureOccurrenceCount);
        Assert.Equal(0, status.TotalNoOpenLogCount);
        Assert.Equal(1, status.TotalErrorCount);
        Assert.Equal(0, status.ErrorCountSinceLastSnapshot);
        Assert.Equal(180, status.TotalDbDurationMs);
        Assert.Equal(65, status.TotalProcessingDurationMs);
        Assert.Equal(150, status.MaxDbDurationMs);
        Assert.Equal(40, status.MaxProcessingDurationMs);
        Assert.Equal(30, status.LastDbDurationMs);
        Assert.Equal(40, status.LastProcessingDurationMs);
        Assert.Equal(startedAt.AddMinutes(2), status.LastSeenAt);
    }

    [Fact]
    public async Task RecordFailedAsync_records_failed_status_and_error_counters()
    {
        await using var db = CreateControlDbContext();
        var writer = new NagLogCopyDelegatorStatusWriter(db);
        var delegatorId = Guid.NewGuid();
        var startedAt = new DateTimeOffset(2026, 6, 8, 10, 0, 0, TimeSpan.Zero);
        var failedAt = startedAt.AddMinutes(3);

        await writer.RecordStartedAsync(
            delegatorId,
            "NagCopyDelegatorLoop",
            startedAt);

        await writer.RecordFailedAsync(
            delegatorId,
            "NagCopyDelegatorLoop",
            failedAt,
            communityId: Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

        var status = await db.NagLogCopyDelegatorStatuses.SingleAsync(item => item.DelegatorId == delegatorId);

        Assert.Equal("NagCopyDelegatorLoop", status.DelegatorName);
        Assert.Equal(Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), status.CommunityId);
        Assert.Equal(NagLogCopyDelegatorStatusState.Failed, status.Status);
        Assert.Equal(failedAt, status.LastSeenAt);
        Assert.Equal(failedAt, status.LastErrorAt);
        Assert.Equal(1, status.TotalErrorCount);
        Assert.Equal(1, status.ErrorCountSinceLastSnapshot);
    }

    private static DailyNaggerControlDbContext CreateControlDbContext()
    {
        var connectionString = Environment.GetEnvironmentVariable(
            "ConnectionStrings__DailyNaggerControl")
            ?? throw new InvalidOperationException("ConnectionStrings__DailyNaggerControl is not set.");

        var options = new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new DailyNaggerControlDbContext(options);
    }
}
