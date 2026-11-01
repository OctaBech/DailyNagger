using Xunit;

namespace DailyNagger.Server.Tests.TestUtilities.SqlServer;

[CollectionDefinition(Name)]
public sealed class SqlServerTestCollection : ICollectionFixture<SqlServerTestFixture>
{
    public const string Name = "SQL Server tests";
}
