using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Operations;

[Collection(SqlServerTestCollection.Name)]
public sealed class GetDataDbConnectionTests
{
    [Fact]
    public async Task CreateAsync_returns_connection_with_password_from_configuration()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        var communityId = Guid.NewGuid();

        db.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Connection test",
            ConnectionStringTemplate = "Server=localhost,1433;Database=DailyNaggerData;User Id=sa;TrustServerCertificate=True",
            PasswordSecretName = null
        });

        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DailyNaggerData:Password"] = "test-password",
                ["DataDbConnection:CacheMinutes"] = "60"
            })
            .Build();

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var getConnection = new GetDataDbConnection(new ControlDbRead(db), configuration, cache);

        await using var connection = await getConnection.CreateAsync(communityId);
        var builder = new SqlConnectionStringBuilder(connection.ConnectionString);

        Assert.Equal("localhost,1433", builder.DataSource);
        Assert.Equal("DailyNaggerData", builder.InitialCatalog);
        Assert.Equal("sa", builder.UserID);
        Assert.Equal("test-password", builder.Password);

        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task CreateAsync_reuses_cached_connection_string_for_same_community()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        var communityId = Guid.NewGuid();

        db.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Connection cache test",
            ConnectionStringTemplate = "Server=localhost,1433;Database=DailyNaggerData;User Id=sa;TrustServerCertificate=True",
            PasswordSecretName = null
        });

        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DailyNaggerData:Password"] = "test-password",
                ["DataDbConnection:CacheMinutes"] = "60"
            })
            .Build();

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var getConnection = new GetDataDbConnection(new ControlDbRead(db), configuration, cache);

        await using var firstConnection = await getConnection.CreateAsync(communityId);

        var community = await db.NagCommunities.SingleAsync(community => community.Id == communityId);
        community.ConnectionStringTemplate = "Server=localhost,1433;Database=ChangedDatabase;User Id=sa;TrustServerCertificate=True";
        await db.SaveChangesAsync();

        await using var secondConnection = await getConnection.CreateAsync(communityId);

        var firstBuilder = new SqlConnectionStringBuilder(firstConnection.ConnectionString);
        var secondBuilder = new SqlConnectionStringBuilder(secondConnection.ConnectionString);

        Assert.Equal("DailyNaggerData", firstBuilder.InitialCatalog);
        Assert.Equal("DailyNaggerData", secondBuilder.InitialCatalog);

        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task OpenAsync_refreshes_cached_connection_string_when_open_fails()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        var communityId = Guid.NewGuid();

        db.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Connection refresh test",
            ConnectionStringTemplate = "Server=invalid-host;Database=DailyNaggerData;User Id=sa;TrustServerCertificate=True;Connect Timeout=1",
            PasswordSecretName = null
        });

        await db.SaveChangesAsync();

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DailyNaggerData:Password"] = GetDataPassword(),
                ["DataDbConnection:CacheMinutes"] = "60"
            })
            .Build();

        using var cache = new MemoryCache(new MemoryCacheOptions());
        var getConnection = new GetDataDbConnection(new ControlDbRead(db), configuration, cache);

        await using var cachedBadConnection = await getConnection.CreateAsync(communityId);
        var cachedBadBuilder = new SqlConnectionStringBuilder(cachedBadConnection.ConnectionString);

        Assert.Equal("invalid-host", cachedBadBuilder.DataSource);

        var community = await db.NagCommunities.SingleAsync(community => community.Id == communityId);
        community.ConnectionStringTemplate = GetDataConnectionStringTemplate();
        await db.SaveChangesAsync();

        await using var refreshedConnection = await getConnection.OpenAsync(communityId);
        var refreshedBuilder = new SqlConnectionStringBuilder(refreshedConnection.ConnectionString);

        Assert.NotEqual("invalid-host", refreshedBuilder.DataSource);
        Assert.Equal("DailyNaggerData", refreshedBuilder.InitialCatalog);

        await transaction.RollbackAsync();
    }

    private static DailyNaggerControlDbContext CreateDbContext()
    {
        var connectionString = GetControlConnectionString();
        var options = new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        return new DailyNaggerControlDbContext(options);
    }

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

    private static string GetDataConnectionString()
    {
        var environmentValue = Environment.GetEnvironmentVariable(
            "ConnectionStrings__DailyNaggerData");

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
                    .GetProperty("DailyNaggerData")
                    .GetString()
                    ?? throw new InvalidOperationException(
                        "ConnectionStrings:DailyNaggerData is empty.");
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            "Missing ConnectionStrings:DailyNaggerData. Set it as an environment variable or in src/DailyNagger.Server/appsettings.Local.json.");
    }

    private static string GetControlConnectionString()
    {
        var environmentValue = Environment.GetEnvironmentVariable(
            "ConnectionStrings__DailyNaggerControl");

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
                    .GetProperty("DailyNaggerControl")
                    .GetString()
                    ?? throw new InvalidOperationException(
                        "ConnectionStrings:DailyNaggerControl is empty.");
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            "Missing ConnectionStrings:DailyNaggerControl. Set it as an environment variable or in src/DailyNagger.Server/appsettings.Local.json.");
    }
}
