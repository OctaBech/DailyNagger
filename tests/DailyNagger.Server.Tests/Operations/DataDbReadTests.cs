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
                "task_log",
                "IX_task_log_nag_id_closed_on_updated_at"));
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
                Title = "Data read test nag",
                ActiveLogDueOn = new DateOnly(2026, 6, 1),
                IsDeactivated = false,
                UpdatedAt = new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero),
                ScheduleRules =
                [
                    new ScheduleRule
                    {
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

            var nag = await dataDbRead.GetNagAsync(communityId);

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
