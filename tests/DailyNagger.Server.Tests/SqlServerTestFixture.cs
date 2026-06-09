using System.Text.Json;
using DailyNagger.Server.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Tests;

public sealed class SqlServerTestFixture : IAsyncLifetime
{
    private const string ControlConnectionEnvironmentName = "ConnectionStrings__DailyNaggerControl";
    private const string DataConnectionEnvironmentName = "ConnectionStrings__DailyNaggerData";
    private const string DataPasswordEnvironmentName = "DailyNaggerData__Password";
    private const string ControlDatabaseName = "DailyNaggerControl_Test";
    private const string DataDatabaseName = "DailyNaggerData_Test";
    private readonly SemaphoreSlim resetLock = new(1, 1);

    public string ControlConnectionString { get; private set; } = "";
    public string DataConnectionString { get; private set; } = "";
    public string DataPassword { get; private set; } = "";

    public async Task InitializeAsync()
    {
        var baseControlConnectionString = GetConnectionString("DailyNaggerControl");
        var baseDataConnectionString = GetConnectionString("DailyNaggerData");

        ControlConnectionString = WithDatabase(baseControlConnectionString, ControlDatabaseName);
        DataConnectionString = WithDatabase(baseDataConnectionString, DataDatabaseName);
        DataPassword = new SqlConnectionStringBuilder(baseDataConnectionString).Password;

        Environment.SetEnvironmentVariable(ControlConnectionEnvironmentName, ControlConnectionString);
        Environment.SetEnvironmentVariable(DataConnectionEnvironmentName, DataConnectionString);
        Environment.SetEnvironmentVariable(DataPasswordEnvironmentName, DataPassword);

        await RecreateDatabaseAsync(ControlConnectionString);
        await RecreateDatabaseAsync(DataConnectionString);
        await MigrateAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    public async Task ResetAsync()
    {
        await resetLock.WaitAsync();

        try
        {
            await ClearDatabaseAsync(DataConnectionString);
            await ClearDatabaseAsync(ControlConnectionString);
        }
        finally
        {
            resetLock.Release();
        }
    }

    private async Task MigrateAsync()
    {
        await using var controlDb = new DailyNaggerControlDbContext(
            new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
                .UseSqlServer(ControlConnectionString)
                .Options);

        await using var dataDb = new DailyNaggerDbContext(
            new DbContextOptionsBuilder<DailyNaggerDbContext>()
                .UseSqlServer(DataConnectionString)
                .Options);

        await controlDb.Database.MigrateAsync();
        await dataDb.Database.MigrateAsync();
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
                declare @sql nvarchar(max) = N'alter database ' + quotename(@databaseName) + N' set single_user with rollback immediate';
                exec sp_executesql @sql;

                set @sql = N'drop database ' + quotename(@databaseName);
                exec sp_executesql @sql;
            end

            declare @createSql nvarchar(max) = N'create database ' + quotename(@databaseName);
            exec sp_executesql @createSql;
            """;
        command.Parameters.AddWithValue("@databaseName", databaseName);

        await command.ExecuteNonQueryAsync();
    }

    private static async Task ClearDatabaseAsync(string connectionString)
    {
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        await using var command = connection.CreateCommand();
        command.CommandText = """
            declare @disableConstraintsSql nvarchar(max) = N'';
            declare @deleteSql nvarchar(max) = N'';
            declare @enableConstraintsSql nvarchar(max) = N'';

            select @disableConstraintsSql = string_agg(
                N'alter table ' + quotename(schema_name(schema_id)) + N'.' + quotename(name) + N' nocheck constraint all;',
                char(10))
            from sys.tables
            where is_ms_shipped = 0
                and name <> N'__EFMigrationsHistory';

            select @deleteSql = string_agg(
                N'delete from ' + quotename(schema_name(schema_id)) + N'.' + quotename(name) + N';',
                char(10))
            from sys.tables
            where is_ms_shipped = 0
                and name <> N'__EFMigrationsHistory';

            select @enableConstraintsSql = string_agg(
                N'alter table ' + quotename(schema_name(schema_id)) + N'.' + quotename(name) + N' with check check constraint all;',
                char(10))
            from sys.tables
            where is_ms_shipped = 0
                and name <> N'__EFMigrationsHistory';

            if @disableConstraintsSql is not null
            begin
                exec sp_executesql @disableConstraintsSql;
                exec sp_executesql @deleteSql;
                exec sp_executesql @enableConstraintsSql;
            end
            """;

        await command.ExecuteNonQueryAsync();
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
