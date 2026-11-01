using System.Data;
using DailyNagger.Server.Data.Connections;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations.Demo;

public sealed class DemoDataOperations(GetDataDbConnection connections)
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
        await using (var exists = Command(connection, transaction,
            "select count(*) from dbo.nag where user_id = @source", userId, templateUserId))
        {
            if (Convert.ToInt32(await exists.ExecuteScalarAsync(cancellationToken)) == 0) return false;
        }

        foreach (var table in Tables)
        {
            var columns = await ReadColumnsAsync(connection, transaction, table, cancellationToken);
            var keys = columns.Where(column => column.IsKey && column.Name != "user_id").ToArray();
            if (keys.Length == 0 || !columns.Any(column => column.Name == "user_id" && column.IsKey))
                throw new InvalidOperationException($"Demo table '{table}' must have a user-scoped key.");

            var names = string.Join(", ", columns.Select(column => Quote(column.Name)));
            var values = string.Join(", ", columns.Select(column =>
                column.Name == "user_id" ? "@target" : $"source.{Quote(column.Name)}"));
            var match = string.Join(" and ", keys.Select(column =>
                $"target.{Quote(column.Name)} = source.{Quote(column.Name)}"));
            var updates = string.Join(", ", columns.Where(column => !column.IsKey).Select(column =>
                $"{Quote(column.Name)} = source.{Quote(column.Name)}"));
            var sql = $"""
                insert into dbo.{Quote(table)} ({names})
                select {values} from dbo.{Quote(table)} source
                where source.user_id = @source and not exists (
                    select 1 from dbo.{Quote(table)} target
                    where target.user_id = @target and {match});
                """;
            // Insert missing parents/children first, then update existing rows (including reparenting).
            if (updates.Length > 0)
                sql += $"""

                    update target set {updates}
                    from dbo.{Quote(table)} target
                    join dbo.{Quote(table)} source on {match}
                    where target.user_id = @target and source.user_id = @source;
                    """;
            await using var command = Command(connection, transaction, sql, userId, templateUserId);
            await command.ExecuteNonQueryAsync(cancellationToken);
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
            await using var command = Command(connection, transaction,
                $"delete from dbo.{Quote(table)} where user_id = @target", userId);
            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private static async Task<List<Column>> ReadColumnsAsync(SqlConnection connection,
        SqlTransaction transaction, string table, CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand("""
            select c.name, cast(case when exists (
                select 1 from sys.indexes i join sys.index_columns ic
                  on ic.object_id = i.object_id and ic.index_id = i.index_id
                where i.object_id = c.object_id and i.is_primary_key = 1
                  and ic.column_id = c.column_id) then 1 else 0 end as bit)
            from sys.columns c
            where c.object_id = object_id(@table) and c.is_computed = 0
              and c.is_identity = 0 and c.generated_always_type = 0
              and c.system_type_id <> 189
            order by c.column_id
            """, connection, transaction);
        command.Parameters.AddWithValue("@table", $"dbo.{table}");
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var columns = new List<Column>();
        while (await reader.ReadAsync(cancellationToken))
            columns.Add(new Column(reader.GetString(0), reader.GetBoolean(1)));
        return columns;
    }

    private static SqlCommand Command(SqlConnection connection, SqlTransaction transaction,
        string sql, Guid userId, Guid? sourceUserId = null)
    {
        var command = new SqlCommand(sql, connection, transaction);
        command.Parameters.Add("@target", SqlDbType.UniqueIdentifier).Value = userId;
        if (sourceUserId.HasValue)
            command.Parameters.Add("@source", SqlDbType.UniqueIdentifier).Value = sourceUserId.Value;
        return command;
    }

    private static string Quote(string name) => $"[{name.Replace("]", "]]", StringComparison.Ordinal)}]";
    private sealed record Column(string Name, bool IsKey);
}
