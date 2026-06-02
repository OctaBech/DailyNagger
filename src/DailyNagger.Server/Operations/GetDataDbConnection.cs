using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Operations;

public sealed class GetDataDbConnection(
    ControlDbRead controlDbRead,
    IConfiguration configuration,
    IMemoryCache cache)
{
    public async Task<SqlConnection> CreateAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = GetConnectionStringCacheKey(communityId);

        if (cache.TryGetValue(cacheKey, out string? cachedConnectionString))
        {
            return new SqlConnection(cachedConnectionString);
        }

        return await RefreshAsync(communityId, cancellationToken);
    }

    public async Task<SqlConnection> OpenAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        var connection = await CreateAsync(communityId, cancellationToken);

        try
        {
            await connection.OpenAsync(cancellationToken);

            return connection;
        }
        catch (SqlException)
        {
            await connection.DisposeAsync();

            var refreshedConnection = await RefreshAsync(communityId, cancellationToken);
            await refreshedConnection.OpenAsync(cancellationToken);

            return refreshedConnection;
        }
    }

    public async Task<SqlConnection> RefreshAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        var settings = await controlDbRead.GetCommunityDbConnectionSettingsAsync(
            communityId,
            cancellationToken);

        var password = GetPassword(settings);
        var connectionString = BuildConnectionString(settings, password);

        cache.Set(
            GetConnectionStringCacheKey(communityId),
            connectionString,
            GetConnectionStringCacheLifetime());

        return new SqlConnection(connectionString);
    }

    private static string GetConnectionStringCacheKey(Guid communityId) =>
        $"data-db-connection-string:{communityId}";

    private TimeSpan GetConnectionStringCacheLifetime()
    {
        var cacheMinutes = configuration.GetValue<int>("DataDbConnection:CacheMinutes");

        if (cacheMinutes <= 0)
        {
            throw new InvalidOperationException(
                "DataDbConnection:CacheMinutes must be greater than 0.");
        }

        return TimeSpan.FromMinutes(cacheMinutes);
    }

    private string GetPassword(CommunityDbConnectionSettings settings)
    {
        if (!string.IsNullOrWhiteSpace(settings.PasswordSecretName))
        {
            throw new NotImplementedException("Secret store lookup is not implemented yet.");
        }

        return configuration["DailyNaggerData:Password"]
            ?? throw new InvalidOperationException(
                "Missing DailyNaggerData:Password configuration.");
    }

    private static string BuildConnectionString(
        CommunityDbConnectionSettings settings,
        string password)
    {
        var builder = new SqlConnectionStringBuilder(settings.ConnectionStringTemplate)
        {
            Password = password
        };

        return builder.ConnectionString;
    }
}
