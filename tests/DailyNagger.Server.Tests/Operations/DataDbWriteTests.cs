using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Scheduling;
using DailyNagger.Server.Tests;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace DailyNagger.Server.Tests.Operations;

[Collection(SqlServerTestCollection.Name)]
public sealed class DataDbWriteTests(SqlServerTestFixture fixture) : SqlServerTestBase(fixture)
{
    [Fact]
    public async Task NagLog_updated_at_must_not_be_default_value()
    {
        await using var dataDb = CreateDataDbContext();

        var nagId = Guid.NewGuid();

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Default updatedAt test",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = new DateOnly(2026, 6, 1),
            IsDeactivated = false
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = Guid.NewGuid(),
            NagId = nagId,
            UpdatedAt = DateTimeOffset.MinValue
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => dataDb.SaveChangesAsync());
    }

    [Fact]
    public async Task CopyLapsedNagLogAsync_copies_open_log_tree_with_new_ids_and_updates_active_due_date()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldNagLogId = Guid.NewGuid();
        var rootNodeId = Guid.NewGuid();
        var childNodeId = Guid.NewGuid();
        var inputId = Guid.NewGuid();
        var expectedActiveLogDueOn = new DateOnly(2026, 6, 1);
        var today = new DateOnly(2026, 6, 2);
        var closedOn = new DateTimeOffset(2026, 6, 2, 10, 30, 0, TimeSpan.Zero);
        var oldUpdatedAt = new DateTimeOffset(2026, 6, 1, 9, 0, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Copy lapsed nag log test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Gym - Push day",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = expectedActiveLogDueOn,
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = oldNagLogId,
            NagId = nagId,
            ClosedOn = null,
            UpdatedAt = oldUpdatedAt
        });

        dataDb.NagNodes.AddRange(
            new NagNode
            {
                Id = rootNodeId,
                NagLogId = oldNagLogId,
                ParentNagNodeId = null,
                Name = "Bench press",
                SortOrder = 0
            },
            new NagNode
            {
                Id = childNodeId,
                NagLogId = oldNagLogId,
                ParentNagNodeId = rootNodeId,
                Name = "Set 1",
                SortOrder = 0
            });

        dataDb.NagInputs.Add(new NagInput
        {
            Id = inputId,
            NagLogId = oldNagLogId,
            ParentNagNodeId = childNodeId,
            Label = "Weight",
            Description = "Working set",
            ValueType = NagInputValueType.Decimal,
            Unit = "kg",
            Value = "80.5",
            SortOrder = 0
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);

        var result = await dataDbWrite.CopyLapsedNagLogAsync(
            communityId,
            nagId,
            expectedActiveLogDueOn,
            today,
            closedOn);

        Assert.Equal(CopyLapsedNagLogStatus.Copied, result.Status);
        Assert.Equal(nagId, result.NagId);
        Assert.Equal(oldNagLogId, result.OldNagLogId);
        Assert.NotNull(result.NewNagLogId);
        Assert.Equal(new DateOnly(2026, 6, 8), result.ActiveLogDueOn);

        dataDb.ChangeTracker.Clear();

        var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);
        Assert.Equal(new DateOnly(2026, 6, 8), storedNag.ActiveLogDueOn);
        Assert.Equal(1, storedNag.Version);

        var oldNagLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == oldNagLogId);
        Assert.Equal(closedOn, oldNagLog.ClosedOn);
        Assert.Equal(closedOn, oldNagLog.UpdatedAt);

        var newNagLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == result.NewNagLogId);
        Assert.Equal(nagId, newNagLog.NagId);
        Assert.Equal(oldNagLogId, newNagLog.CopiedFromNagLogId);
        Assert.Null(newNagLog.ClosedOn);
        Assert.Equal(closedOn, newNagLog.UpdatedAt);

        var newNodes = await dataDb.NagNodes
            .Where(node => node.NagLogId == newNagLog.Id)
            .ToListAsync();

        Assert.Equal(2, newNodes.Count);
        Assert.DoesNotContain(newNodes, node => node.Id == rootNodeId);
        Assert.DoesNotContain(newNodes, node => node.Id == childNodeId);

        var newRoot = Assert.Single(newNodes, node => node.Name == "Bench press");
        var newChild = Assert.Single(newNodes, node => node.Name == "Set 1");

        Assert.Null(newRoot.ParentNagNodeId);
        Assert.Equal(newRoot.Id, newChild.ParentNagNodeId);

        var newInput = await dataDb.NagInputs.SingleAsync(input => input.NagLogId == newNagLog.Id);

        Assert.NotEqual(inputId, newInput.Id);
        Assert.Equal(newNagLog.Id, newInput.NagLogId);
        Assert.Equal(newChild.Id, newInput.ParentNagNodeId);
        Assert.Equal("Weight", newInput.Label);
        Assert.Equal("Working set", newInput.Description);
        Assert.Equal(NagInputValueType.Decimal, newInput.ValueType);
        Assert.Equal("kg", newInput.Unit);
        Assert.Null(newInput.Value);
        Assert.Equal("80.5", newInput.PreviousValue);
    }

    [Fact]
    public async Task NagCopyDelegator_does_not_copy_lapsed_log_until_copy_grace_has_expired()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldNagLogId = Guid.NewGuid();
        var activeLogDueOn = new DateOnly(2026, 6, 1);
        var today = new DateOnly(2026, 6, 2);
        var now = new DateTimeOffset(2026, 6, 2, 10, 0, 0, TimeSpan.Zero);
        var copyGracePeriod = TimeSpan.FromMinutes(10);
        var updatedAtInsideGrace = now.AddMinutes(-9);
        var afterGrace = now.AddMinutes(2);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Copy grace integration test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Gym - Push day",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = oldNagLogId,
            NagId = nagId,
            ClosedOn = null,
            UpdatedAt = updatedAtInsideGrace
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbRead = CreateDataDbRead(controlDb);
        var dataDbWrite = CreateDataDbWrite(controlDb);
        var worker = new NagCopyWorker(
            dataDbWrite,
            NullLogger<NagCopyWorker>.Instance);
        var delegator = new NagCopyDelegator(
            (readToday, readNow, readGracePeriod, cancellationToken) =>
                dataDbRead.GetLapsedNagAsync(
                    communityId,
                    readToday,
                    readNow,
                    readGracePeriod,
                    cancellationToken),
            worker.RunAsync,
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 1));

        var beforeGraceResult = await delegator.RunOnceAsync(
            communityId,
            today,
            now,
            copyGracePeriod);

        Assert.Equal(0, beforeGraceResult.CopiedCount);
        Assert.Equal(1, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == nagId));

        dataDb.ChangeTracker.Clear();

        var oldNagLogBeforeGrace = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == oldNagLogId);

        Assert.Null(oldNagLogBeforeGrace.ClosedOn);
        Assert.Equal(updatedAtInsideGrace, oldNagLogBeforeGrace.UpdatedAt);

        var afterGraceResult = await delegator.RunOnceAsync(
            communityId,
            today,
            afterGrace,
            copyGracePeriod);

        Assert.Equal(1, afterGraceResult.CopiedCount);

        dataDb.ChangeTracker.Clear();

        var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);
        var oldNagLogAfterGrace = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == oldNagLogId);
        var newNagLog = await dataDb.NagLogs.SingleAsync(nagLog =>
            nagLog.NagId == nagId
            && nagLog.Id != oldNagLogId);

        Assert.Equal(new DateOnly(2026, 6, 8), storedNag.ActiveLogDueOn);
        Assert.Equal(afterGrace, oldNagLogAfterGrace.ClosedOn);
        Assert.Equal(afterGrace, oldNagLogAfterGrace.UpdatedAt);
        Assert.Equal(oldNagLogId, newNagLog.CopiedFromNagLogId);
        Assert.Null(newNagLog.ClosedOn);
        Assert.Equal(afterGrace, newNagLog.UpdatedAt);
        Assert.Equal(2, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == nagId));
    }

    [Fact]
    public async Task NagCopyDelegator_does_not_copy_deactivated_lapsed_nag()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var activeNagId = Guid.NewGuid();
        var deactivatedNagId = Guid.NewGuid();
        var activeNagLogId = Guid.NewGuid();
        var deactivatedNagLogId = Guid.NewGuid();
        var activeLogDueOn = new DateOnly(2026, 6, 1);
        var today = new DateOnly(2026, 6, 2);
        var now = new DateTimeOffset(2026, 6, 2, 10, 0, 0, TimeSpan.Zero);
        var copyGracePeriod = TimeSpan.FromMinutes(10);
        var oldUpdatedAt = now.AddMinutes(-11);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Deactivated copy integration test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.AddRange(
            CreateLapsedWeeklyNag(activeNagId, "Active lapsed nag", activeLogDueOn, isDeactivated: false),
            CreateLapsedWeeklyNag(deactivatedNagId, "Deactivated lapsed nag", activeLogDueOn, isDeactivated: true));

        dataDb.NagLogs.AddRange(
            new NagLog
            {
                Id = activeNagLogId,
                NagId = activeNagId,
                UpdatedAt = oldUpdatedAt
            },
            new NagLog
            {
                Id = deactivatedNagLogId,
                NagId = deactivatedNagId,
                UpdatedAt = oldUpdatedAt
            });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbRead = CreateDataDbRead(controlDb);
        var dataDbWrite = CreateDataDbWrite(controlDb);
        var worker = new NagCopyWorker(
            dataDbWrite,
            NullLogger<NagCopyWorker>.Instance);
        var delegator = new NagCopyDelegator(
            (readToday, readNow, readGracePeriod, cancellationToken) =>
                dataDbRead.GetLapsedNagAsync(
                    communityId,
                    readToday,
                    readNow,
                    readGracePeriod,
                    cancellationToken),
            worker.RunAsync,
            new NagCopyDelegatorOptions(MaxParallelCopyWorkers: 1));

        var result = await delegator.RunOnceAsync(
            communityId,
            today,
            now,
            copyGracePeriod);

        Assert.Equal(1, result.CopiedCount);

        dataDb.ChangeTracker.Clear();

        var activeNag = await dataDb.Nags.SingleAsync(nag => nag.Id == activeNagId);
        var deactivatedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == deactivatedNagId);
        var activeOldLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == activeNagLogId);
        var deactivatedLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == deactivatedNagLogId);

        Assert.Equal(new DateOnly(2026, 6, 8), activeNag.ActiveLogDueOn);
        Assert.Equal(now, activeOldLog.ClosedOn);
        Assert.Equal(activeLogDueOn, deactivatedNag.ActiveLogDueOn);
        Assert.Null(deactivatedLog.ClosedOn);
        Assert.Equal(oldUpdatedAt, deactivatedLog.UpdatedAt);
        Assert.Equal(2, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == activeNagId));
        Assert.Equal(1, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == deactivatedNagId));
    }

    [Fact]
    public async Task CopyLapsedNagLogAsync_noops_when_expected_due_date_is_stale()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldNagLogId = Guid.NewGuid();
        var activeLogDueOn = new DateOnly(2026, 6, 1);
        var oldUpdatedAt = new DateTimeOffset(2026, 6, 1, 9, 0, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Stale copy lapsed nag log test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Gym - Push day",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = oldNagLogId,
            NagId = nagId,
            ClosedOn = null,
            UpdatedAt = oldUpdatedAt
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);

        var result = await dataDbWrite.CopyLapsedNagLogAsync(
            communityId,
            nagId,
            activeLogDueOn.AddDays(-1),
            new DateOnly(2026, 6, 2),
            DateTimeOffset.UtcNow);

        Assert.Equal(CopyLapsedNagLogStatus.Stale, result.Status);
        Assert.Equal(nagId, result.NagId);
        Assert.Null(result.OldNagLogId);
        Assert.Null(result.NewNagLogId);
        Assert.Null(result.ActiveLogDueOn);

        dataDb.ChangeTracker.Clear();

        var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);
        var storedNagLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == oldNagLogId);

        Assert.Equal(activeLogDueOn, storedNag.ActiveLogDueOn);
        Assert.Null(storedNagLog.ClosedOn);
        Assert.Equal(1, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == nagId));
    }

    [Fact]
    public async Task CopyLapsedNagLogAsync_closes_open_log_without_new_copy_when_no_future_occurrence_exists()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldNagLogId = Guid.NewGuid();
        var activeLogDueOn = new DateOnly(2026, 6, 1);
        var closedOn = new DateTimeOffset(2026, 6, 2, 10, 30, 0, TimeSpan.Zero);
        var oldUpdatedAt = new DateTimeOffset(2026, 6, 1, 9, 0, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "No future occurrence copy test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Expired gym nag",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            ExpiresOn = new DateOnly(2026, 6, 1),
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = oldNagLogId,
            NagId = nagId,
            ClosedOn = null,
            UpdatedAt = oldUpdatedAt
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);

        var result = await dataDbWrite.CopyLapsedNagLogAsync(
            communityId,
            nagId,
            activeLogDueOn,
            new DateOnly(2026, 6, 2),
            closedOn);

        Assert.Equal(CopyLapsedNagLogStatus.NoFutureOccurrence, result.Status);
        Assert.Equal(nagId, result.NagId);
        Assert.Equal(oldNagLogId, result.OldNagLogId);
        Assert.Null(result.NewNagLogId);
        Assert.Null(result.ActiveLogDueOn);

        dataDb.ChangeTracker.Clear();

        var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);
        var storedNagLog = await dataDb.NagLogs.SingleAsync(nagLog => nagLog.Id == oldNagLogId);

        Assert.Null(storedNag.ActiveLogDueOn);
        Assert.Equal(closedOn, storedNagLog.ClosedOn);
        Assert.Equal(closedOn, storedNagLog.UpdatedAt);
        Assert.Equal(1, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == nagId));
    }

    [Fact]
    public async Task CopyLapsedNagLogAsync_returns_no_open_log_when_lapsed_nag_has_no_open_log()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var closedNagLogId = Guid.NewGuid();
        var activeLogDueOn = new DateOnly(2026, 6, 1);
        var closedOn = new DateTimeOffset(2026, 6, 1, 10, 30, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "No open log copy test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nag
        {
            Id = nagId,
            Title = "Broken gym nag",
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        });

        dataDb.NagLogs.Add(new NagLog
        {
            Id = closedNagLogId,
            NagId = nagId,
            ClosedOn = closedOn,
            UpdatedAt = closedOn
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);

        var result = await dataDbWrite.CopyLapsedNagLogAsync(
            communityId,
            nagId,
            activeLogDueOn,
            new DateOnly(2026, 6, 2),
            DateTimeOffset.UtcNow);

        Assert.Equal(CopyLapsedNagLogStatus.NoOpenLog, result.Status);
        Assert.Equal(nagId, result.NagId);
        Assert.Null(result.OldNagLogId);
        Assert.Null(result.NewNagLogId);
        Assert.Null(result.ActiveLogDueOn);

        dataDb.ChangeTracker.Clear();

        var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);

        Assert.Equal(activeLogDueOn, storedNag.ActiveLogDueOn);
        Assert.Equal(1, await dataDb.NagLogs.CountAsync(nagLog => nagLog.NagId == nagId));
    }

    private static DailyNaggerControlDbContext CreateControlDbContext()
    {
        var options = new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
            .UseSqlServer(GetControlConnectionString())
            .Options;

        return new DailyNaggerControlDbContext(options);
    }

    private static DailyNaggerDbContext CreateDataDbContext()
    {
        var options = new DbContextOptionsBuilder<DailyNaggerDbContext>()
            .UseSqlServer(GetDataConnectionString())
            .Options;

        return new DailyNaggerDbContext(options);
    }

    private static DataDbWrite CreateDataDbWrite(DailyNaggerControlDbContext controlDb)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DailyNaggerData:Password"] = GetDataPassword(),
                ["DataDbConnection:CacheMinutes"] = "60"
            })
            .Build();

        return new DataDbWrite(
            new GetDataDbConnection(
                new ControlDbRead(controlDb),
                configuration,
                new TestOptionsMonitor<DataDbConnectionOptions>(new DataDbConnectionOptions
                {
                    CacheMinutes = 60
                }),
                new MemoryCache(new MemoryCacheOptions())),
            new NagOccurrenceCalculator());
    }

    private static DataDbRead CreateDataDbRead(DailyNaggerControlDbContext controlDb)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DailyNaggerData:Password"] = GetDataPassword(),
                ["DataDbConnection:CacheMinutes"] = "60"
            })
            .Build();

        return new DataDbRead(new GetDataDbConnection(
            new ControlDbRead(controlDb),
            configuration,
            new TestOptionsMonitor<DataDbConnectionOptions>(new DataDbConnectionOptions
            {
                CacheMinutes = 60
            }),
            new MemoryCache(new MemoryCacheOptions())));
    }

    private static Nag CreateLapsedWeeklyNag(
        Guid nagId,
        string title,
        DateOnly activeLogDueOn,
        bool isDeactivated) =>
        new()
        {
            Id = nagId,
            Title = title,
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = isDeactivated,
            NagTimes =
            [
                new NagTime
                {
                    Id = Guid.NewGuid(),
                    NagId = nagId,
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Monday
                }
            ]
        };

    private static string GetControlConnectionString() =>
        GetConnectionString("DailyNaggerControl");

    private static string GetDataConnectionString() =>
        GetConnectionString("DailyNaggerData");

    private static string GetDataConnectionStringTemplate()
    {
        var builder = new SqlConnectionStringBuilder(GetDataConnectionString())
        {
            Password = string.Empty
        };

        return builder.ConnectionString;
    }

    private static string GetDataPassword()
    {
        var builder = new SqlConnectionStringBuilder(GetDataConnectionString());

        return builder.Password;
    }

    private static string GetConnectionString(string name)
    {
        var environmentValue = Environment.GetEnvironmentVariable(
            $"ConnectionStrings__{name}");

        if (!string.IsNullOrWhiteSpace(environmentValue))
        {
            return environmentValue;
        }

        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var localSettingsPath = Path.Combine(
                directory.FullName,
                "src",
                "DailyNagger.Server",
                "appsettings.Local.json");

            if (File.Exists(localSettingsPath))
            {
                using var document = JsonDocument.Parse(File.ReadAllText(localSettingsPath));

                return document.RootElement
                    .GetProperty("ConnectionStrings")
                    .GetProperty(name)
                    .GetString()
                    ?? throw new InvalidOperationException(
                        $"ConnectionStrings:{name} is empty.");
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            $"Missing ConnectionStrings:{name}. Set it as an environment variable or in src/DailyNagger.Server/appsettings.Local.json.");
    }
}
