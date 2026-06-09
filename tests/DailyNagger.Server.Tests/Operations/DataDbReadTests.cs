using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Operations;

[Collection(SqlServerTestCollection.Name)]
public sealed class DataDbReadTests(SqlServerTestFixture fixture) : SqlServerTestBase(fixture)
{
    [Fact]
    public async Task Data_schema_contains_indexes_for_nag_plan_and_lapsed_nag_queries()
    {
        await using var connection = new SqlConnection(GetDataConnectionString());
        await connection.OpenAsync();

        Assert.Equal(
            ["is_deactivated", "active_log_due_on"],
            await GetIndexColumnsAsync(
                connection,
                "nag",
                "IX_nag_is_deactivated_active_log_due_on"));

        Assert.Equal(
            ["nag_id", "closed_on", "updated_at"],
            await GetIndexColumnsAsync(
                connection,
                "nag_log",
                "IX_nag_log_nag_id_closed_on_updated_at"));
    }

    [Fact]
    public async Task GetLapsedNagAsync_returns_only_active_nags_with_due_date_before_today()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var yesterdayNagId = Guid.NewGuid();
        var todayNagId = Guid.NewGuid();
        var tomorrowNagId = Guid.NewGuid();
        var noDueDateNagId = Guid.NewGuid();
        var deactivatedNagId = Guid.NewGuid();
        var today = new DateOnly(2026, 6, 6);
        var now = new DateTimeOffset(2026, 6, 6, 10, 0, 0, TimeSpan.Zero);
        var copyGracePeriod = TimeSpan.FromMinutes(10);
        var oldUpdatedAt = now.AddMinutes(-11);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Lapsed nag read test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.AddRange(
            CreateNag(yesterdayNagId, "Yesterday", today.AddDays(-1), isDeactivated: false),
            CreateNag(todayNagId, "Today", today, isDeactivated: false),
            CreateNag(tomorrowNagId, "Tomorrow", today.AddDays(1), isDeactivated: false),
            CreateNag(noDueDateNagId, "No due date", null, isDeactivated: false),
            CreateNag(deactivatedNagId, "Deactivated", today.AddDays(-1), isDeactivated: true));

        dataDb.NagLogs.AddRange(
            CreateOpenNagLog(yesterdayNagId, oldUpdatedAt),
            CreateOpenNagLog(todayNagId, oldUpdatedAt),
            CreateOpenNagLog(tomorrowNagId, oldUpdatedAt),
            CreateOpenNagLog(noDueDateNagId, oldUpdatedAt),
            CreateOpenNagLog(deactivatedNagId, oldUpdatedAt));

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbRead = CreateDataDbRead(controlDb);

        var lapsedNag = await dataDbRead.GetLapsedNagAsync(
            communityId,
            today,
            now,
            copyGracePeriod);

        var item = Assert.Single(lapsedNag);
        Assert.Equal(yesterdayNagId, item.NagId);
        Assert.Equal(today.AddDays(-1), item.ActiveLogDueOn);
    }

    [Fact]
    public async Task GetLapsedNagAsync_returns_only_open_logs_older_than_copy_grace_period()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var readyNagId = Guid.NewGuid();
        var recentNagId = Guid.NewGuid();
        var closedNagId = Guid.NewGuid();
        var noOpenLogNagId = Guid.NewGuid();
        var today = new DateOnly(2026, 6, 6);
        var dueDate = today.AddDays(-1);
        var now = new DateTimeOffset(2026, 6, 6, 10, 0, 0, TimeSpan.Zero);
        var copyGracePeriod = TimeSpan.FromMinutes(10);

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Lapsed nag grace read test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.AddRange(
            CreateNag(readyNagId, "Ready", dueDate, isDeactivated: false),
            CreateNag(recentNagId, "Recent", dueDate, isDeactivated: false),
            CreateNag(closedNagId, "Closed", dueDate, isDeactivated: false),
            CreateNag(noOpenLogNagId, "No open log", dueDate, isDeactivated: false));

        dataDb.NagLogs.AddRange(
            CreateOpenNagLog(readyNagId, now.AddMinutes(-11)),
            CreateOpenNagLog(recentNagId, now.AddMinutes(-9)),
            new NagLog
            {
                Id = Guid.NewGuid(),
                NagId = closedNagId,
                ClosedOn = now.AddMinutes(-1),
                UpdatedAt = now.AddMinutes(-11)
            });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        var dataDbRead = CreateDataDbRead(controlDb);

        var lapsedNag = await dataDbRead.GetLapsedNagAsync(
            communityId,
            today,
            now,
            copyGracePeriod);

        var item = Assert.Single(lapsedNag);
        Assert.Equal(readyNagId, item.NagId);
        Assert.Equal(dueDate, item.ActiveLogDueOn);
    }

    [Fact]
    public async Task GetNagAsync_returns_nags_from_community_data_database()
    {
        await using var controlDb = CreateControlDbContext();
        await using var controlTransaction = await controlDb.Database.BeginTransactionAsync();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var nagId = Guid.NewGuid();

        try
        {
            controlDb.NagCommunities.Add(new NagCommunity
            {
                Id = communityId,
                Name = "Data read test",
                ConnectionStringTemplate = GetDataConnectionStringTemplate(),
                PasswordSecretName = null
            });

            dataDb.Nags.Add(new Nag
            {
                Id = nagId,
                Title = "Data read test nag",
                ScheduleUpdatedAt = DateTimeOffset.UtcNow,
                ActiveLogDueOn = new DateOnly(2026, 6, 1),
                IsDeactivated = false,
                NagTimes =
                [
                    new NagTime
                    {
                        TimeType = NagTimeType.MonthlyDay,
                        DayOfMonth = 1
                    }
                ]
            });

            await controlDb.SaveChangesAsync();
            await dataDb.SaveChangesAsync();

            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["DailyNaggerData:Password"] = GetDataPassword(),
                    ["DataDbConnection:CacheMinutes"] = "60"
                })
                .Build();

            var dataDbRead = CreateDataDbRead(controlDb);

            var nag = await dataDbRead.GetNagAsync(communityId);

            Assert.Contains(
                nag,
                nag => nag.Id == nagId
                    && nag.Title == "Data read test nag"
                    && nag.ActiveLogDueOn == new DateOnly(2026, 6, 1)
                    && nag.NagTimes.Any(rule =>
                        rule.TimeType == NagTimeType.MonthlyDay
                        && rule.DayOfMonth == 1));
        }
        finally
        {
            await dataDb.Nags
                .Where(nag => nag.Id == nagId)
                .ExecuteDeleteAsync();
        }

        await controlTransaction.RollbackAsync();
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

    private static Nag CreateNag(
        Guid id,
        string title,
        DateOnly? activeLogDueOn,
        bool isDeactivated) =>
        new()
        {
            Id = id,
            Title = title,
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = isDeactivated
        };

    private static NagLog CreateOpenNagLog(
        Guid nagId,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = Guid.NewGuid(),
            NagId = nagId,
            UpdatedAt = updatedAt
        };

    private static async Task<string[]> GetIndexColumnsAsync(
        SqlConnection connection,
        string tableName,
        string indexName)
    {
        await using var command = new SqlCommand(
            """
            select column_name = col.name
            from sys.indexes idx
            inner join sys.index_columns idx_col on idx_col.object_id = idx.object_id
                and idx_col.index_id = idx.index_id
            inner join sys.columns col on col.object_id = idx_col.object_id
                and col.column_id = idx_col.column_id
            inner join sys.tables tbl on tbl.object_id = idx.object_id
            where tbl.name = @tableName
                and idx.name = @indexName
                and idx_col.is_included_column = 0
            order by idx_col.key_ordinal
            """,
            connection);

        command.Parameters.AddWithValue("@tableName", tableName);
        command.Parameters.AddWithValue("@indexName", indexName);

        await using var reader = await command.ExecuteReaderAsync();

        var columns = new List<string>();

        while (await reader.ReadAsync())
        {
            columns.Add(reader.GetString(0));
        }

        return columns.ToArray();
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
