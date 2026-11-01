using System.Data;
using DailyNagger.Server.Data.Connections;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Demo;

public sealed class DemoDataWrite(GetDataDbConnection connections)
{
    // Parents before children. Never discover additional tables implicitly.
    private static readonly string[] Tables =
        ["nag", "schedule_rule", "task_log", "task_item", "task_entry", "user_tag", "user_mood"];

    public async Task<bool> CopyAsync(Guid communityId, Guid templateUserId, Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(communityId, cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        if (!await DemoDataCommands.SourceExistsAsync(
            connection, transaction, userId, templateUserId, cancellationToken)) return false;

        foreach (var table in Tables)
        {
            await DemoDataCommands.CopyTableAsync(
                connection, transaction, table, userId, templateUserId, cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public async Task DeleteAsync(Guid communityId, Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await connections.OpenAsync(communityId, cancellationToken);
        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(
            IsolationLevel.Serializable, cancellationToken);
        foreach (var table in Tables.Reverse())
        {
            await DemoDataCommands.DeleteTableAsync(
                connection, transaction, table, userId, cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }
}
