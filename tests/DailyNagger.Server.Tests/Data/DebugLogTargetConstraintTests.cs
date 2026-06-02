using System.Text.Json;
using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DailyNagger.Server.Tests.Data;

[Collection(SqlServerTestCollection.Name)]
public sealed class DebugLogTargetConstraintTests
{
    [Fact]
    public async Task SaveChanges_accepts_debug_log_target_with_app_instance()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        db.DebugLogTargets.Add(new DebugLogTarget
        {
            AppInstanceId = $"test-{Guid.NewGuid():N}",
            MinimumLevel = LogLevel.Debug,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
            Reason = "Valid write test"
        });

        await db.SaveChangesAsync();
        await transaction.RollbackAsync();
    }

    [Fact]
    public async Task SaveChanges_rejects_debug_log_target_without_user_or_app_instance()
    {
        await using var db = CreateDbContext();
        await using var transaction = await db.Database.BeginTransactionAsync();

        db.DebugLogTargets.Add(new DebugLogTarget
        {
            MinimumLevel = LogLevel.Debug,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
            Reason = "Constraint test"
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
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
