using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
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
    public async Task TaskLog_updated_at_must_not_be_default_value()
    {
        await using var dataDb = CreateDataDbContext();

        var nagId = Guid.NewGuid();

        dataDb.Nags.Add(new Nagger
        {
            Id = nagId,
            Title = "Default updatedAt test",
            ActiveLogDueOn = new DateOnly(2026, 6, 1),
            IsDeactivated = false,
            UpdatedAt = new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero)
        });

        dataDb.TaskLogs.Add(new TaskLog
        {
            Id = Guid.NewGuid(),
            NagId = nagId,
            UpdatedAt = DateTimeOffset.MinValue
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => dataDb.SaveChangesAsync());
    }

    [Fact]
    public async Task SaveTaskLogAsync_applies_late_closed_log_update_without_recreating_copied_log()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldTaskLogId = Guid.NewGuid();
        var copiedTaskLogId = Guid.NewGuid();
        var closedOn = new DateTimeOffset(2026, 6, 2, 10, 30, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Late closed log update leaves copied log",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nagger
        {
            Id = nagId,
            Title = "Late update nag",
            ActiveLogDueOn = new DateOnly(2026, 6, 8),
            IsDeactivated = false,
            UpdatedAt = closedOn
        });

        dataDb.TaskLogs.AddRange(
            new TaskLog
            {
                Id = oldTaskLogId,
                NagId = nagId,
                ClosedOn = closedOn,
                UpdatedAt = closedOn,
                Version = 3
            },
            new TaskLog
            {
                Id = copiedTaskLogId,
                NagId = nagId,
                CopiedFromTaskLogId = oldTaskLogId,
                ClosedOn = null,
                UpdatedAt = closedOn,
                Version = 0
            });

        dataDb.TaskItems.Add(new TaskItem
        {
            Id = Guid.NewGuid(),
            TaskLogId = copiedTaskLogId,
            ParentTaskItemId = null,
            Name = "Old copied task",
            SortOrder = 0
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);
        var clientUpdatedAt = closedOn.AddMinutes(5);
        var updatedTaskItem = new TaskItem
        {
            Id = Guid.NewGuid(),
            TaskLogId = oldTaskLogId,
            ParentTaskItemId = null,
            Name = "Late task update",
            IsDone = true,
            SortOrder = 0
        };

        var savedTaskLog = await dataDbWrite.SaveTaskLogAsync(
            communityId,
            userId,
            oldTaskLogId,
            nagId,
            copiedFromTaskLogId: null,
            closedOn: null,
            tag: null,
            updatedAt: clientUpdatedAt,
            clientIdentity: null,
            descendantTaskItemCount: 1,
            doneDescendantTaskItemCount: 1,
            baseVersion: 3,
            nextVersion: 4,
            taskItems: [updatedTaskItem]);

        Assert.Equal(4, savedTaskLog.Version);
        Assert.Equal(closedOn, savedTaskLog.ClosedOn);

        dataDb.ChangeTracker.Clear();

        var storedOldTaskLog = await dataDb.TaskLogs.SingleAsync(taskLog => taskLog.Id == oldTaskLogId);
        Assert.Equal(closedOn, storedOldTaskLog.ClosedOn);
        Assert.Equal(clientUpdatedAt, storedOldTaskLog.UpdatedAt);
        Assert.Equal(4, storedOldTaskLog.Version);
        Assert.Equal(1, storedOldTaskLog.DescendantTaskItemCount);
        Assert.Equal(1, storedOldTaskLog.DoneDescendantTaskItemCount);

        var storedOldTaskItem = await dataDb.TaskItems.SingleAsync(taskItem => taskItem.TaskLogId == oldTaskLogId);
        Assert.Equal("Late task update", storedOldTaskItem.Name);
        Assert.True(storedOldTaskItem.IsDone);

        var storedCopiedTaskLog = await dataDb.TaskLogs.SingleAsync(taskLog => taskLog.Id == copiedTaskLogId);
        Assert.Null(storedCopiedTaskLog.ClosedOn);
        Assert.Equal(0, storedCopiedTaskLog.Version);
        Assert.Equal(0, storedCopiedTaskLog.DescendantTaskItemCount);
        Assert.Equal(0, storedCopiedTaskLog.DoneDescendantTaskItemCount);

        var storedCopiedTaskItem = await dataDb.TaskItems.SingleAsync(taskItem => taskItem.TaskLogId == copiedTaskLogId);
        Assert.Equal("Old copied task", storedCopiedTaskItem.Name);
        Assert.False(storedCopiedTaskItem.IsDone);
        Assert.NotEqual(updatedTaskItem.Id, storedCopiedTaskItem.Id);
    }

    [Fact]
    public async Task SaveTaskLogAsync_applies_late_closed_log_update_without_recreating_used_copied_log()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var nagId = Guid.NewGuid();
        var oldTaskLogId = Guid.NewGuid();
        var copiedTaskLogId = Guid.NewGuid();
        var copiedTaskItemId = Guid.NewGuid();
        var closedOn = new DateTimeOffset(2026, 6, 2, 10, 30, 0, TimeSpan.Zero);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Late closed log update leaves used copy",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nagger
        {
            Id = nagId,
            Title = "Late update used copy nag",
            ActiveLogDueOn = new DateOnly(2026, 6, 8),
            IsDeactivated = false,
            UpdatedAt = closedOn
        });

        dataDb.TaskLogs.AddRange(
            new TaskLog
            {
                Id = oldTaskLogId,
                NagId = nagId,
                ClosedOn = closedOn,
                UpdatedAt = closedOn,
                Version = 3
            },
            new TaskLog
            {
                Id = copiedTaskLogId,
                NagId = nagId,
                CopiedFromTaskLogId = oldTaskLogId,
                ClosedOn = null,
                UpdatedAt = closedOn,
                Version = 0
            });

        dataDb.TaskItems.Add(new TaskItem
        {
            Id = copiedTaskItemId,
            TaskLogId = copiedTaskLogId,
            ParentTaskItemId = null,
            Name = "Used copied task",
            SortOrder = 0
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbWrite = CreateDataDbWrite(controlDb);
        var clientUpdatedAt = closedOn.AddMinutes(5);

        await dataDbWrite.SaveTaskLogAsync(
            communityId,
            userId,
            oldTaskLogId,
            nagId,
            copiedFromTaskLogId: null,
            closedOn: null,
            tag: null,
            updatedAt: clientUpdatedAt,
            clientIdentity: null,
            descendantTaskItemCount: 1,
            doneDescendantTaskItemCount: 1,
            baseVersion: 3,
            nextVersion: 4,
            taskItems:
            [
                new TaskItem
                {
                    Id = Guid.NewGuid(),
                    TaskLogId = oldTaskLogId,
                    ParentTaskItemId = null,
                    Name = "Late task update",
                    IsDone = true,
                    SortOrder = 0
                }
            ]);

        dataDb.ChangeTracker.Clear();

        var storedOldTaskLog = await dataDb.TaskLogs.SingleAsync(taskLog => taskLog.Id == oldTaskLogId);
        Assert.Equal(closedOn, storedOldTaskLog.ClosedOn);
        Assert.Equal(clientUpdatedAt, storedOldTaskLog.UpdatedAt);
        Assert.Equal(4, storedOldTaskLog.Version);

        var storedCopiedTaskLog = await dataDb.TaskLogs.SingleAsync(taskLog => taskLog.Id == copiedTaskLogId);
        Assert.Null(storedCopiedTaskLog.ClosedOn);
        Assert.Equal(0, storedCopiedTaskLog.Version);

        var storedCopiedTaskItem = await dataDb.TaskItems.SingleAsync(taskItem => taskItem.TaskLogId == copiedTaskLogId);
        Assert.Equal(copiedTaskItemId, storedCopiedTaskItem.Id);
        Assert.Equal("Used copied task", storedCopiedTaskItem.Name);
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
                new MemoryCache(new MemoryCacheOptions())));
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
