namespace DailyNagger.Server.Tests;

public abstract class SqlServerTestBase(SqlServerTestFixture fixture) : IAsyncLifetime
{
    public Task InitializeAsync() => fixture.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;
}
