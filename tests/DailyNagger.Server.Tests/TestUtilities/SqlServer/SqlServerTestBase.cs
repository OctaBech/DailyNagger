namespace DailyNagger.Server.Tests.TestUtilities.SqlServer;

public abstract class SqlServerTestBase(SqlServerTestFixture fixture) : IAsyncLifetime
{
    public Task InitializeAsync() => fixture.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}
