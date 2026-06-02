using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Tests.Api;

public sealed class TaskSeriesApiTests
{
    [Fact]
    public async Task Get_task_series_returns_records_from_community_data_database()
    {
        var testData = await CreateRoutedTaskSeriesAsync();

        try
        {
            using var client = CreateServerClient();

            var response = await client.GetAsync(
                $"/api/task-series?communityId={testData.CommunityId}");
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(
                response.StatusCode == HttpStatusCode.OK,
                responseBody);

            var items = await response.Content.ReadFromJsonAsync<TaskSeriesDto[]>();

            Assert.NotNull(items);
            Assert.Contains(items, item => item.Id == testData.TaskSeriesId);
        }
        finally
        {
            await DeleteRoutedTaskSeriesAsync(testData);
        }
    }

    [Fact]
    public async Task Get_task_series_returns_not_found_when_community_does_not_exist()
    {
        try
        {
            using var client = CreateServerClient();

            var response = await client.GetAsync($"/api/task-series?communityId={Guid.NewGuid()}");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ConnectionStrings__DailyNaggerControl", null);
            Environment.SetEnvironmentVariable("DailyNaggerData__Password", null);
        }
    }

    private static async Task<RoutedTaskSeriesTestData> CreateRoutedTaskSeriesAsync()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var testData = new RoutedTaskSeriesTestData(
            Guid.NewGuid(),
            Guid.NewGuid());

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = testData.CommunityId,
            Name = "API data read test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.TaskSeries.Add(new TaskSeries
        {
            Id = testData.TaskSeriesId
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        return testData;
    }

    private static HttpClient CreateServerClient()
    {
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DailyNaggerControl",
            GetControlConnectionString());
        Environment.SetEnvironmentVariable(
            "DailyNaggerData__Password",
            GetDataPassword());

        var factory = new WebApplicationFactory<Program>();

        return factory.CreateClient();
    }

    private static async Task DeleteRoutedTaskSeriesAsync(
        RoutedTaskSeriesTestData testData)
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        await dataDb.TaskSeries
            .Where(series => series.Id == testData.TaskSeriesId)
            .ExecuteDeleteAsync();

        await controlDb.NagCommunities
            .Where(community => community.Id == testData.CommunityId)
            .ExecuteDeleteAsync();

        Environment.SetEnvironmentVariable("ConnectionStrings__DailyNaggerControl", null);
        Environment.SetEnvironmentVariable("DailyNaggerData__Password", null);
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

    private sealed record RoutedTaskSeriesTestData(
        Guid CommunityId,
        Guid TaskSeriesId);
}
