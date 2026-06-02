using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Tests.Operations;

[Collection(SqlServerTestCollection.Name)]
public sealed class ControlDbReadTests
{
    [Fact]
    public async Task GetCommunityDbConnectionSettingsAsync_returns_connection_template_and_secret_name()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        var communityId = Guid.NewGuid();

        db.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Route test",
            ConnectionStringTemplate = "Server=localhost;Database=DailyNaggerData;User Id=sa",
            PasswordSecretName = "route-test-secret"
        });

        await db.SaveChangesAsync();

        var controlDbRead = new ControlDbRead(db);

        var settings = await controlDbRead.GetCommunityDbConnectionSettingsAsync(communityId);

        Assert.Equal(communityId, settings.NagCommunityId);
        Assert.Equal("Server=localhost;Database=DailyNaggerData;User Id=sa", settings.ConnectionStringTemplate);
        Assert.Equal("route-test-secret", settings.PasswordSecretName);

        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task GetCommunityDbConnectionSettingsAsync_throws_when_community_does_not_exist()
    {
        await using var db = CreateDbContext();
        var controlDbRead = new ControlDbRead(db);

        var exception = await Assert.ThrowsAsync<NagCommunityNotFoundException>(
            () => controlDbRead.GetCommunityDbConnectionSettingsAsync(Guid.NewGuid()));

        Assert.Contains("NagCommunity was not found", exception.Message);
    }

    [Fact]
    public async Task GetCommunityDbConnectionSettingsAsync_throws_when_connection_template_is_empty()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        var communityId = Guid.NewGuid();

        db.NagCommunities.Add(new NagCommunity
        {
            Id = communityId,
            Name = "Invalid route test",
            ConnectionStringTemplate = "",
            PasswordSecretName = null
        });

        await db.SaveChangesAsync();

        var controlDbRead = new ControlDbRead(db);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => controlDbRead.GetCommunityDbConnectionSettingsAsync(communityId));

        Assert.Contains("ConnectionStringTemplate is empty", exception.Message);

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
