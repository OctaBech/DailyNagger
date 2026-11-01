using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.TaskLogs;

internal static class TaskLogQueries
{
    public static async Task<IReadOnlyList<TaskItem>> GetTaskItemsAsync(
        SqlConnection connection,
        Guid userId,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
                user_id,
                parent_task_item_id,
                name,
                tag,
                is_done,
                interaction_at,
                interaction_time_zone,
                interaction_locale,
                interaction_mood,
                interaction_mood_at,
                rollover_behavior,
                descendant_task_item_count,
                done_descendant_task_item_count,
                sort_order
            from task_item
            where task_log_id = @taskLogId
                and user_id = @userId
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);

        var nodes = new List<TaskItem>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nodes.Add(new TaskItem
                {
                    Id = reader.GetGuid(0),
                    UserId = reader.GetGuid(1),
                    TaskLogId = taskLogId,
                    ParentTaskItemId = reader.IsDBNull(2) ? null : reader.GetGuid(2),
                    Name = reader.GetString(3),
                    Tag = reader.IsDBNull(4) ? null : reader.GetString(4),
                    IsDone = reader.GetBoolean(5),
                    InteractionAt = reader.IsDBNull(6) ? null : reader.GetDateTimeOffset(6),
                    InteractionTimeZone = reader.IsDBNull(7) ? null : reader.GetString(7),
                    InteractionLocale = reader.IsDBNull(8) ? null : reader.GetString(8),
                    InteractionMood = reader.IsDBNull(9) ? null : reader.GetString(9),
                    InteractionMoodAt = reader.IsDBNull(10) ? null : reader.GetDateTimeOffset(10),
                    RolloverBehavior = Enum.Parse<RolloverBehavior>(reader.GetString(11)),
                    DescendantTaskItemCount = reader.GetInt32(12),
                    DoneDescendantTaskItemCount = reader.GetInt32(13),
                    SortOrder = reader.GetInt32(14)
                });
            }
        }

        return nodes;
    }

    public static async Task<IReadOnlyList<TaskEntry>> GetTaskEntriesAsync(
        SqlConnection connection,
        Guid userId,
        Guid taskLogId,
        Guid parentTaskItemId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
                user_id,
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
                sort_order
            from task_entry
            where task_log_id = @taskLogId
                and user_id = @userId
                and parent_task_item_id = @parentTaskItemId
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@parentTaskItemId", parentTaskItemId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var inputs = new List<TaskEntry>();

        while (await reader.ReadAsync(cancellationToken))
        {
            inputs.Add(new TaskEntry
            {
                Id = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                TaskLogId = taskLogId,
                ParentTaskItemId = parentTaskItemId,
                Label = reader.GetString(2),
                Description = reader.IsDBNull(3) ? null : reader.GetString(3),
                ValueType = Enum.Parse<TaskEntryValueType>(reader.GetString(4)),
                Tag = reader.IsDBNull(5) ? null : reader.GetString(5),
                Value = reader.IsDBNull(6) ? null : reader.GetString(6),
                LastTaskRunReferenceValue = reader.IsDBNull(7) ? null : reader.GetString(7),
                RolloverBehavior = Enum.Parse<RolloverBehavior>(reader.GetString(8)),
                InteractionAt = reader.IsDBNull(9) ? null : reader.GetDateTimeOffset(9),
                InteractionTimeZone = reader.IsDBNull(10) ? null : reader.GetString(10),
                InteractionLocale = reader.IsDBNull(11) ? null : reader.GetString(11),
                InteractionMood = reader.IsDBNull(12) ? null : reader.GetString(12),
                InteractionMoodAt = reader.IsDBNull(13) ? null : reader.GetDateTimeOffset(13),
                SortOrder = reader.GetInt32(14)
            });
        }

        return inputs;
    }
}
