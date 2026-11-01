using System.Text;
using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations.TaskLogs;

internal static class TaskLogTreeWrite
{
    public static async Task DeleteAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await DeleteTaskEntriesAsync(
            connection,
            transaction,
            taskLogId,
            userId,
            cancellationToken);

        await DeleteTaskItemsAsync(
            connection,
            transaction,
            taskLogId,
            userId,
            cancellationToken);
    }

    public static async Task InsertAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        TaskLog taskLog,
        CancellationToken cancellationToken)
    {
        await InsertTaskItemsAsync(
            connection,
            transaction,
            taskLog.TaskItems,
            cancellationToken);

        await InsertTaskEntriesAsync(
            connection,
            transaction,
            taskLog.TaskItems.SelectMany(node => node.TaskEntries).ToArray(),
            cancellationToken);
    }

    private static async Task InsertTaskItemsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        IReadOnlyList<TaskItem> taskItems,
        CancellationToken cancellationToken)
    {
        if (taskItems.Count == 0)
        {
            return;
        }

        var sql = new StringBuilder("""
            insert into task_item
                (
                    id,
                    user_id,
                    task_log_id,
                    parent_task_item_id,
                    name,
                    tag,
                    is_done,
                    rollover_behavior,
                    interaction_at,
                    interaction_time_zone,
                    interaction_locale,
                    interaction_mood,
                    interaction_mood_at,
                    descendant_task_item_count,
                    done_descendant_task_item_count,
                    sort_order)
            values
            """);

        await using var command = new SqlCommand
        {
            Connection = connection,
            Transaction = transaction
        };

        for (var i = 0; i < taskItems.Count; i++)
        {
            if (i > 0)
            {
                sql.AppendLine(",");
            }

            sql.Append($"""
                (
                    @nodeId{i},
                    @nodeUserId{i},
                    @nodeTaskLogId{i},
                    @nodeParentTaskItemId{i},
                    @nodeName{i},
                    @nodeTag{i},
                    @nodeIsDone{i},
                    @nodeRolloverBehavior{i},
                    @nodeInteractionAt{i},
                    @nodeInteractionTimeZone{i},
                    @nodeInteractionLocale{i},
                    @nodeInteractionMood{i},
                    @nodeInteractionMoodAt{i},
                    @nodeDescendantTaskItemCount{i},
                    @nodeDoneDescendantTaskItemCount{i},
                    @nodeSortOrder{i})
                """);

            command.Parameters.AddWithValue($"@nodeId{i}", taskItems[i].Id);
            command.Parameters.AddWithValue($"@nodeUserId{i}", taskItems[i].UserId);
            command.Parameters.AddWithValue($"@nodeTaskLogId{i}", taskItems[i].TaskLogId);
            command.Parameters.AddWithValue($"@nodeParentTaskItemId{i}", (object?)taskItems[i].ParentTaskItemId ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeName{i}", taskItems[i].Name);
            command.Parameters.AddWithValue($"@nodeTag{i}", (object?)taskItems[i].Tag ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeIsDone{i}", taskItems[i].IsDone);
            command.Parameters.AddWithValue($"@nodeRolloverBehavior{i}", taskItems[i].RolloverBehavior.ToString());
            command.Parameters.AddWithValue($"@nodeInteractionAt{i}", (object?)taskItems[i].InteractionAt ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeInteractionTimeZone{i}", (object?)taskItems[i].InteractionTimeZone ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeInteractionLocale{i}", (object?)taskItems[i].InteractionLocale ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeInteractionMood{i}", (object?)taskItems[i].InteractionMood ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeInteractionMoodAt{i}", (object?)taskItems[i].InteractionMoodAt ?? DBNull.Value);
            command.Parameters.AddWithValue($"@nodeDescendantTaskItemCount{i}", taskItems[i].DescendantTaskItemCount);
            command.Parameters.AddWithValue($"@nodeDoneDescendantTaskItemCount{i}", taskItems[i].DoneDescendantTaskItemCount);
            command.Parameters.AddWithValue($"@nodeSortOrder{i}", taskItems[i].SortOrder);
        }

        command.CommandText = sql.ToString();

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task InsertTaskEntriesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        IReadOnlyList<TaskEntry> taskEntries,
        CancellationToken cancellationToken)
    {
        if (taskEntries.Count == 0)
        {
            return;
        }

        var sql = new StringBuilder("""
            insert into task_entry
                (
                    id,
                    user_id,
                    task_log_id,
                    parent_task_item_id,
                    label,
                    description,
                    value_type,
                    tag,
                    value,
                    last_task_run_reference_value,
                    rollover_behavior,
                    interaction_at,
                    interaction_time_zone,
                    interaction_locale,
                    interaction_mood,
                    interaction_mood_at,
                    sort_order)
            values
            """);

        await using var command = new SqlCommand
        {
            Connection = connection,
            Transaction = transaction
        };

        for (var i = 0; i < taskEntries.Count; i++)
        {
            if (i > 0)
            {
                sql.AppendLine(",");
            }

            sql.Append($"""
                (
                    @inputId{i},
                    @inputUserId{i},
                    @inputTaskLogId{i},
                    @inputParentTaskItemId{i},
                    @inputLabel{i},
                    @inputDescription{i},
                    @inputValueType{i},
                    @inputTag{i},
                    @inputValue{i},
                    @inputLastTaskRunReferenceValue{i},
                    @inputRolloverBehavior{i},
                    @inputInteractionAt{i},
                    @inputInteractionTimeZone{i},
                    @inputInteractionLocale{i},
                    @inputInteractionMood{i},
                    @inputInteractionMoodAt{i},
                    @inputSortOrder{i})
                """);

            command.Parameters.AddWithValue($"@inputId{i}", taskEntries[i].Id);
            command.Parameters.AddWithValue($"@inputUserId{i}", taskEntries[i].UserId);
            command.Parameters.AddWithValue($"@inputTaskLogId{i}", taskEntries[i].TaskLogId);
            command.Parameters.AddWithValue($"@inputParentTaskItemId{i}", taskEntries[i].ParentTaskItemId);
            command.Parameters.AddWithValue($"@inputLabel{i}", taskEntries[i].Label);
            command.Parameters.AddWithValue($"@inputDescription{i}", (object?)taskEntries[i].Description ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputValueType{i}", taskEntries[i].ValueType.ToString());
            command.Parameters.AddWithValue($"@inputTag{i}", (object?)taskEntries[i].Tag ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputValue{i}", (object?)taskEntries[i].Value ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputLastTaskRunReferenceValue{i}", (object?)taskEntries[i].LastTaskRunReferenceValue ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputRolloverBehavior{i}", taskEntries[i].RolloverBehavior.ToString());
            command.Parameters.AddWithValue($"@inputInteractionAt{i}", (object?)taskEntries[i].InteractionAt ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputInteractionTimeZone{i}", (object?)taskEntries[i].InteractionTimeZone ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputInteractionLocale{i}", (object?)taskEntries[i].InteractionLocale ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputInteractionMood{i}", (object?)taskEntries[i].InteractionMood ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputInteractionMoodAt{i}", (object?)taskEntries[i].InteractionMoodAt ?? DBNull.Value);
            command.Parameters.AddWithValue($"@inputSortOrder{i}", taskEntries[i].SortOrder);
        }

        command.CommandText = sql.ToString();

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task DeleteTaskEntriesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            delete task_entry
            from task_entry
            where task_entry.task_log_id = @taskLogId
                and task_entry.user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task DeleteTaskItemsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        while (true)
        {
            await using var command = new SqlCommand(
                """
                delete from task_item
                where task_log_id = @taskLogId
                    and user_id = @userId
                    and not exists (
                        select 1
                        from task_item child
                        where child.parent_task_item_id = task_item.id
                            and child.user_id = task_item.user_id
                    )
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@taskLogId", taskLogId);
            command.Parameters.AddWithValue("@userId", userId);

            var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

            if (affectedRows == 0)
            {
                return;
            }
        }
    }
}
