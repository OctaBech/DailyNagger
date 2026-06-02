using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Operations;

public sealed class DataDbReadTests
{
    [Fact]
    public async Task GetTaskSeriesAsync_returns_task_series_from_community_data_database()
    {
        await using var controlDb = CreateControlDbContext();
        await using var controlTransaction = await controlDb.Database.BeginTransactionAsync();
        await using var dataDb = CreateDataDbContext();

        var communityId = Guid.NewGuid();
        var taskSeriesId = Guid.NewGuid();

        try
        {
            controlDb.NagCommunities.Add(new NagCommunity
            {
                Id = communityId,
                Name = "Data read test",
                ConnectionStringTemplate = GetDataConnectionStringTemplate(),
                PasswordSecretName = null
            });

            dataDb.TaskSeries.Add(new TaskSeries
            {
                Id = taskSeriesId
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

            using var cache = new MemoryCache(new MemoryCacheOptions());
            var getConnection = new GetDataDbConnection(new ControlDbRead(controlDb), configuration, cache);
            var dataDbRead = new DataDbRead(getConnection);

            var taskSeries = await dataDbRead.GetTaskSeriesAsync(communityId);

            Assert.Contains(taskSeries, series => series.Id == taskSeriesId);
        }
        finally
        {
            await dataDb.TaskSeries
                .Where(series => series.Id == taskSeriesId)
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
