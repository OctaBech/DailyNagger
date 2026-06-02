using Xunit;

namespace DailyNagger.Server.Tests;

[CollectionDefinition(Name)]
public sealed class SqlServerTestCollection
{
    public const string Name = "SQL Server tests";
}
