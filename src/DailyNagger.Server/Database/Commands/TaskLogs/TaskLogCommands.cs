using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Commands.TaskLogs;

internal static class TaskLogCommands
{
    public sealed record TaskLogHeader(
        Guid Id,
        DateTimeOffset? ClosedOn,
        int Version);

    public static async Task UpdateTaskEntryValuesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        IReadOnlyList<TaskEntryValueUpdateDto> taskEntries,
        CancellationToken cancellationToken)
    {
        foreach (var input in taskEntries)
        {
            await using var command = new SqlCommand(
                """
                update task_entry
                set
                    value = @value,
                    interaction_at = @interactionAt,
                    interaction_time_zone = @interactionTimeZone,
                    interaction_locale = @interactionLocale,
                    interaction_mood = @interactionMood,
                    interaction_mood_at = @interactionMoodAt
                where id = @id
                    and user_id = @userId
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@id", input.Id);
            command.Parameters.AddWithValue("@userId", userId);
            command.Parameters.AddWithValue("@value", (object?)input.Value ?? DBNull.Value);
            command.Parameters.AddWithValue("@interactionAt", (object?)input.InteractionAt ?? DBNull.Value);
            command.Parameters.AddWithValue("@interactionTimeZone", (object?)input.InteractionTimeZone ?? DBNull.Value);
            command.Parameters.AddWithValue("@interactionLocale", (object?)input.InteractionLocale ?? DBNull.Value);
            command.Parameters.AddWithValue("@interactionMood", (object?)input.InteractionMood ?? DBNull.Value);
            command.Parameters.AddWithValue("@interactionMoodAt", (object?)input.InteractionMoodAt ?? DBNull.Value);

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    public static async Task<bool> TaskLogIsOpenAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select count(*)
            from task_log
            where id = @taskLogId
                and user_id = @userId
                and closed_on is null
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@taskLogId", taskLogId);

        return (int)await command.ExecuteScalarAsync(cancellationToken) == 1;
    }

    public static async Task UpsertTaskLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        TaskLog taskLog,
        bool exists,
        int baseVersion,
        int? currentVersion,
        bool allowClosedUpdate,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            exists
                ? allowClosedUpdate
                    ? """
                      update task_log
                      set
                          nag_id = @nagId,
                          copied_from_task_log_id = @copiedFromTaskLogId,
                          closed_on = @closedOn,
                          tag = @tag,
                          updated_at = @updatedAt,
                          updated_by_client_id = @updatedByClientId,
                          updated_by_device_name = @updatedByDeviceName,
                          updated_by_device_model = @updatedByDeviceModel,
                          version = @version,
                          descendant_task_item_count = @descendantTaskItemCount,
                          done_descendant_task_item_count = @doneDescendantTaskItemCount
                      where id = @id
                          and user_id = @userId
                          and version = @baseVersion
                      """
                    : """
                      update task_log
                      set
                          nag_id = @nagId,
                          copied_from_task_log_id = @copiedFromTaskLogId,
                          closed_on = @closedOn,
                          tag = @tag,
                          updated_at = @updatedAt,
                          updated_by_client_id = @updatedByClientId,
                          updated_by_device_name = @updatedByDeviceName,
                          updated_by_device_model = @updatedByDeviceModel,
                          version = @version,
                          descendant_task_item_count = @descendantTaskItemCount,
                          done_descendant_task_item_count = @doneDescendantTaskItemCount
                      where id = @id
                          and user_id = @userId
                          and version = @baseVersion
                          and closed_on is null
                      """
                : """
                  insert into task_log (
                      id,
                      user_id,
                      nag_id,
                      copied_from_task_log_id,
                      closed_on,
                      tag,
                      updated_at,
                      updated_by_client_id,
                      updated_by_device_name,
                      updated_by_device_model,
                      version,
                      descendant_task_item_count,
                      done_descendant_task_item_count)
                  values (
                      @id,
                      @userId,
                      @nagId,
                      @copiedFromTaskLogId,
                      @closedOn,
                      @tag,
                      @updatedAt,
                      @updatedByClientId,
                      @updatedByDeviceName,
                      @updatedByDeviceModel,
                      @version,
                      @descendantTaskItemCount,
                      @doneDescendantTaskItemCount)
                  """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLog.Id);
        command.Parameters.AddWithValue("@userId", taskLog.UserId);
        command.Parameters.AddWithValue("@nagId", taskLog.NagId);
        command.Parameters.AddWithValue("@copiedFromTaskLogId", (object?)taskLog.CopiedFromTaskLogId ?? DBNull.Value);
        command.Parameters.AddWithValue("@closedOn", (object?)taskLog.ClosedOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@tag", (object?)taskLog.Tag ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedAt", taskLog.UpdatedAt);
        command.Parameters.AddWithValue("@updatedByClientId", (object?)taskLog.UpdatedByClientId ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceName", (object?)taskLog.UpdatedByDeviceName ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceModel", (object?)taskLog.UpdatedByDeviceModel ?? DBNull.Value);
        command.Parameters.AddWithValue("@version", taskLog.Version);
        command.Parameters.AddWithValue("@descendantTaskItemCount", taskLog.DescendantTaskItemCount);
        command.Parameters.AddWithValue("@doneDescendantTaskItemCount", taskLog.DoneDescendantTaskItemCount);

        if (exists)
        {
            command.Parameters.AddWithValue("@baseVersion", baseVersion);
        }

        var affectedRows = await command.ExecuteNonQueryAsync(cancellationToken);

        if (affectedRows == 0)
        {
            throw new ConcurrencyConflictException(
                "TaskLog version conflict.",
                currentVersion);
        }
    }

    public static async Task<int> CountTaskEntriesInTaskLogAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid taskLogId,
        IReadOnlyList<Guid> taskEntryIds,
        CancellationToken cancellationToken)
    {
        var parameterNames = taskEntryIds
            .Select((_, index) => $"@inputId{index}")
            .ToArray();

        await using var command = new SqlCommand(
            $"""
            select count(*)
            from task_entry
            where task_entry.task_log_id = @taskLogId
                and task_entry.user_id = @userId
                and task_entry.id in ({string.Join(", ", parameterNames)})
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@taskLogId", taskLogId);

        for (var i = 0; i < taskEntryIds.Count; i++)
        {
            command.Parameters.AddWithValue(parameterNames[i], taskEntryIds[i]);
        }

        return (int)await command.ExecuteScalarAsync(cancellationToken);
    }

    public static async Task<bool> NagExistsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select 1
            from nag
            where id = @id
                and user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);
        command.Parameters.AddWithValue("@userId", userId);

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    public static async Task<bool> TaskLogExistsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select 1
            from task_log
            where id = @id
                and user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    public static async Task<int?> GetTaskLogVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from task_log
            where id = @id
                and user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null ? null : (int)result;
    }

    public static async Task<TaskLogHeader?> GetTaskLogHeaderAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
                closed_on,
                version
            from task_log
            where id = @id
                and user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new TaskLogHeader(
            reader.GetGuid(0),
            reader.IsDBNull(1) ? null : reader.GetDateTimeOffset(1),
            reader.GetInt32(2));
    }

    public static async Task<int> UpdateTaskLogVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid userId,
        Guid taskLogId,
        int baseVersion,
        int nextVersion,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            update task_log
            set
                version = @nextVersion,
                updated_at = @updatedAt,
                updated_by_client_id = @updatedByClientId,
                updated_by_device_name = @updatedByDeviceName,
                updated_by_device_model = @updatedByDeviceModel
            output inserted.version
            where id = @id
                and user_id = @userId
                and version = @baseVersion
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@baseVersion", baseVersion);
        command.Parameters.AddWithValue("@nextVersion", nextVersion);
        command.Parameters.AddWithValue("@updatedAt", updatedAt);
        command.Parameters.AddWithValue("@updatedByClientId", (object?)clientIdentity?.ClientId ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceName", (object?)clientIdentity?.DeviceName ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceModel", (object?)clientIdentity?.DeviceModel ?? DBNull.Value);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        if (result is null)
        {
            var currentVersion = await GetTaskLogVersionAsync(
                connection,
                transaction,
                userId,
                taskLogId,
                cancellationToken);

            throw new ConcurrencyConflictException(
                "TaskLog version conflict.",
                currentVersion);
        }

        return (int)result;
    }
}
