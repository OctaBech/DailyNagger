using DailyNagger.Server.Database;

namespace DailyNagger.Server.Operations.System;

public sealed class SystemOperations(DatabaseQueries queries)
{
    public Task CheckDatabaseAsync(CancellationToken cancellationToken = default) =>
        queries.System.CheckConnectionAsync(cancellationToken);
}
