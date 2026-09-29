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
    private static readonly Guid TestUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");

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
            ["user_id", "is_deactivated", "active_log_due_on"],
            await GetIndexColumnsAsync(
                connection,
                "nag",
                "IX_nag_user_id_is_deactivated_active_log_due_on"));

        Assert.Equal(
            ["nag_id", "closed_on", "updated_at"],
            await GetIndexColumnsAsync(
                connection,
                "task_log",
                "IX_task_log_nag_id_closed_on_updated_at"));

        Assert.Equal(
            ["user_id", "nag_id", "closed_on", "updated_at"],
            await GetIndexColumnsAsync(
                connection,
                "task_log",
                "IX_task_log_user_id_nag_id_closed_on_updated_at"));

        Assert.Equal(
            ["user_id", "nag_id"],
            await GetIndexColumnsAsync(
                connection,
                "task_log",
                "IX_task_log_user_id_nag_id"));

        Assert.Equal(
            ["user_id", "nag_id"],
            await GetIndexColumnsAsync(
                connection,
                "schedule_rule",
                "IX_schedule_rule_user_id_nag_id"));

        Assert.Equal(
            ["user_id", "task_log_id"],
            await GetIndexColumnsAsync(
                connection,
                "task_item",
                "IX_task_item_user_id_task_log_id"));

        Assert.Equal(
            ["user_id", "task_log_id"],
            await GetIndexColumnsAsync(
                connection,
                "task_entry",
                "IX_task_entry_user_id_task_log_id"));
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

            dataDb.Nags.Add(new Nagger
            {
                Id = nagId,
                UserId = TestUserId,
                Title = "Data read test nag",
                ActiveLogDueOn = new DateOnly(2026, 6, 1),
                IsDeactivated = false,
                UpdatedAt = new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero),
                ScheduleRules =
                [
                    new ScheduleRule
                    {
                        UserId = TestUserId,
                        RuleType = ScheduleRuleType.Date,
                        RuleJson = MonthlyDayRuleJson(1)
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

            var nag = await dataDbRead.GetNagAsync(communityId, TestUserId);

            Assert.Contains(
                nag,
                nag => nag.Id == nagId
                    && nag.Title == "Data read test nag"
                    && nag.ActiveLogDueOn == new DateOnly(2026, 6, 1)
                    && nag.ScheduleRules.Any(rule =>
                        rule.RuleType == ScheduleRuleType.Date
                        && rule.RuleJson == MonthlyDayRuleJson(1)));
        }
        finally
        {
            await dataDb.Nags
                .Where(nag => nag.Id == nagId)
                .ExecuteDeleteAsync();
        }

        await controlTransaction.RollbackAsync();
    }

    [Fact]
    public async Task EnforceUserIdInData_migration_backfills_existing_rows_without_permanent_default()
    {
        var databaseName = $"DailyNaggerData_Migration_{Guid.NewGuid():N}";
        var connectionString = WithDatabase(GetDataConnectionString(), databaseName);
        var martinUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var nagId = Guid.NewGuid();
        var scheduleRuleId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var taskItemId = Guid.NewGuid();
        var taskEntryId = Guid.NewGuid();

        await RecreateDatabaseAsync(connectionString);

        try
        {
            await using (var db = CreateDataDbContext(connectionString))
            {
                await db.Database.MigrateAsync("20260817162350_ReplaceScheduleRuleColumnsWithRuleJson");
            }

            await using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                await using var command = connection.CreateCommand();
                command.CommandText = """
                    insert into nag (
                        id,
                        title,
                        active_log_due_on,
                        expires_on,
                        target_time,
                        is_deactivated,
                        pinned_by,
                        updated_at,
                        version)
                    values (
                        @nagId,
                        N'Legacy nag',
                        '2026-09-01',
                        null,
                        null,
                        0,
                        N'None',
                        sysdatetimeoffset(),
                        1);

                    insert into schedule_rule (
                        id,
                        nag_id,
                        rule_type,
                        rule_json)
                    values (
                        @scheduleRuleId,
                        @nagId,
                        N'Weekday',
                        N'{"month":0,"position":0,"weekday":1}');

                    insert into task_log (
                        id,
                        nag_id,
                        copied_from_task_log_id,
                        closed_on,
                        tag,
                        updated_at,
                        version,
                        descendant_task_item_count,
                        done_descendant_task_item_count)
                    values (
                        @taskLogId,
                        @nagId,
                        null,
                        null,
                        null,
                        sysdatetimeoffset(),
                        1,
                        1,
                        0);

                    insert into task_item (
                        id,
                        task_log_id,
                        parent_task_item_id,
                        name,
                        tag,
                        is_done,
                        rollover_behavior,
                        interaction_at,
                        interaction_time_zone,
                        interaction_locale,
                        interaction_mood,
                        interaction_mood_at,
                        descendant_task_item_count,
                        done_descendant_task_item_count,
                        sort_order)
                    values (
                        @taskItemId,
                        @taskLogId,
                        null,
                        N'Legacy item',
                        null,
                        0,
                        N'Keep',
                        null,
                        null,
                        null,
                        null,
                        null,
                        0,
                        0,
                        0);

                    insert into task_entry (
                        id,
                        task_log_id,
                        parent_task_item_id,
                        label,
                        description,
                        value_type,
                        tag,
                        value,
                        last_task_run_reference_value,
                        rollover_behavior,
                        interaction_at,
                        interaction_time_zone,
                        interaction_locale,
                        interaction_mood,
                        interaction_mood_at,
                        sort_order)
                    values (
                        @taskEntryId,
                        @taskLogId,
                        @taskItemId,
                        N'Legacy entry',
                        null,
                        N'Text',
                        null,
                        N'hello',
                        null,
                        N'MoveValueToHistory',
                        null,
                        null,
                        null,
                        null,
                        null,
                        0);
                    """;
                command.Parameters.AddWithValue("@nagId", nagId);
                command.Parameters.AddWithValue("@scheduleRuleId", scheduleRuleId);
                command.Parameters.AddWithValue("@taskLogId", taskLogId);
                command.Parameters.AddWithValue("@taskItemId", taskItemId);
                command.Parameters.AddWithValue("@taskEntryId", taskEntryId);
                await command.ExecuteNonQueryAsync();
            }

            await using (var db = CreateDataDbContext(connectionString))
            {
                await db.Database.MigrateAsync();
            }

            await using (var db = CreateDataDbContext(connectionString))
            {
                Assert.Equal(martinUserId, await db.Nags.Where(nag => nag.Id == nagId).Select(nag => nag.UserId).SingleAsync());
                Assert.Equal(martinUserId, await db.ScheduleRules.Where(rule => rule.Id == scheduleRuleId).Select(rule => rule.UserId).SingleAsync());
                Assert.Equal(martinUserId, await db.TaskLogs.Where(log => log.Id == taskLogId).Select(log => log.UserId).SingleAsync());
                Assert.Equal(martinUserId, await db.TaskItems.Where(item => item.Id == taskItemId).Select(item => item.UserId).SingleAsync());
                Assert.Equal(martinUserId, await db.TaskEntries.Where(entry => entry.Id == taskEntryId).Select(entry => entry.UserId).SingleAsync());
            }

            await using (var connection = new SqlConnection(connectionString))
            {
                await connection.OpenAsync();
                await using var command = connection.CreateCommand();
                command.CommandText = """
                    insert into nag (
                        id,
                        title,
                        active_log_due_on,
                        expires_on,
                        target_time,
                        is_deactivated,
                        pinned_by,
                        updated_at,
                        version)
                    values (
                        newid(),
                        N'Missing user',
                        null,
                        null,
                        null,
                        0,
                        N'None',
                        sysdatetimeoffset(),
                        1);
                    """;

                await Assert.ThrowsAsync<SqlException>(() => command.ExecuteNonQueryAsync());
            }
        }
        finally
        {
            await DropDatabaseAsync(connectionString);
        }
    }


    private static string MonthlyDayRuleJson(int dayOfMonth) =>
        JsonSerializer.Serialize(
            new
            {
                year = 0,
                month = 0,
                dayOfMonth
            });
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

    private static DailyNaggerDbContext CreateDataDbContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<DailyNaggerDbContext>()
            .UseSqlServer(connectionString)
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

    private static Nagger CreateNag(
        Guid id,
        string title,
        DateOnly? activeLogDueOn,
        bool isDeactivated) =>
        new()
        {
            Id = id,
            UserId = TestUserId,
            Title = title,
            ActiveLogDueOn = activeLogDueOn,
            IsDeactivated = isDeactivated
        };

    private static TaskLog CreateOpenTaskLog(
        Guid nagId,
        DateTimeOffset updatedAt) =>
        new()
        {
            Id = Guid.NewGuid(),
            UserId = TestUserId,
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

    private static string WithDatabase(
        string connectionString,
        string databaseName)
    {
        var builder = new SqlConnectionStringBuilder(connectionString)
        {
            InitialCatalog = databaseName
        };

        return builder.ConnectionString;
    }

    private static async Task RecreateDatabaseAsync(string connectionString)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = builder.InitialCatalog;
        builder.InitialCatalog = "master";

        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            if db_id(@databaseName) is not null
            begin
                declare @dropSql nvarchar(max) = N'drop database ' + quotename(@databaseName);
                exec sp_executesql @dropSql;
            end

            declare @createSql nvarchar(max) = N'create database ' + quotename(@databaseName);
            exec sp_executesql @createSql;
            """;
        command.Parameters.AddWithValue("@databaseName", databaseName);

        await command.ExecuteNonQueryAsync();
    }

    private static async Task DropDatabaseAsync(string connectionString)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = builder.InitialCatalog;
        builder.InitialCatalog = "master";

        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = $"""
            if db_id(@databaseName) is not null
            begin
                declare @singleUserSql nvarchar(max) = N'alter database ' + quotename(@databaseName) + N' set single_user with rollback immediate';
                exec sp_executesql @singleUserSql;

                declare @dropSql nvarchar(max) = N'drop database ' + quotename(@databaseName);
                exec sp_executesql @dropSql;
            end
            """;
        command.Parameters.AddWithValue("@databaseName", databaseName);

        await command.ExecuteNonQueryAsync();
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
