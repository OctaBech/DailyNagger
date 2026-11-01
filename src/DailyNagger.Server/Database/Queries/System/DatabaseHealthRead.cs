using DailyNagger.Server.Database.Contexts.Tenant;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Database.Queries.System;

public sealed class DatabaseHealthRead(DailyNaggerDbContext db)
{
    public async Task CheckConnectionAsync(CancellationToken cancellationToken = default)
    {
        await db.Database.OpenConnectionAsync(cancellationToken);
        await db.Database.CloseConnectionAsync();
    }
}
