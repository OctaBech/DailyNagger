using DailyNagger.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Database.System;

public sealed class DatabaseHealthRead(DailyNaggerDbContext db)
{
    public async Task CheckConnectionAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = db.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);
    }
}
