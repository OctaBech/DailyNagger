using System.Text;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations.TaskLogs;

public sealed record TaskLogWriteResult(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed class TaskLogWrite(GetDataDbConnection getDataDbConnection)
{
    private sealed record TaskLogHeader(
        Guid Id,
        DateTimeOffset? ClosedOn,
        int Version);

    public async Task<TaskLog> SaveTaskLogAsync(
        Guid communityId,
        Guid userId,
        Guid taskLogId,
        Guid nagId,
        Guid? copiedFromTaskLogId,
        DateTimeOffset? closedOn,
        string? tag,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        int descendantTaskItemCount,
        int doneDescendantTaskItemCount,
        int baseVersion,
        int nextVersion,
        IReadOnlyList<TaskItem> taskItems,
        CancellationToken cancellationToken = default)
    {
        var copiedTaskItems = taskItems
            .Select(node => new TaskItem
            {
                Id = node.Id,
                UserId = userId,
                TaskLogId = taskLogId,
                ParentTaskItemId = node.ParentTaskItemId,
                Name = node.Name,
                Tag = node.Tag,
                IsDone = node.IsDone,
                RolloverBehavior = node.RolloverBehavior,
                InteractionAt = node.InteractionAt,
                InteractionTimeZone = node.InteractionTimeZone,
                InteractionLocale = node.InteractionLocale,
                InteractionMood = node.InteractionMood,
                InteractionMoodAt = node.InteractionMoodAt,
                DescendantTaskItemCount = node.DescendantTaskItemCount,
                DoneDescendantTaskItemCount = node.DoneDescendantTaskItemCount,
                SortOrder = node.SortOrder,
                TaskEntries = node.TaskEntries
                    .Select(input => new TaskEntry
                    {
                        Id = input.Id,
                        UserId = userId,
                        TaskLogId = taskLogId,
                        ParentTaskItemId = node.Id,
                        Label = input.Label,
                        Description = input.Description,
                        ValueType = input.ValueType,
                        Tag = input.Tag,
                        Value = input.Value,
                        LastTaskRunReferenceValue = input.LastTaskRunReferenceValue,
                        RolloverBehavior = input.RolloverBehavior,
                        InteractionAt = input.InteractionAt,
                        InteractionTimeZone = input.InteractionTimeZone,
                        InteractionLocale = input.InteractionLocale,
                        InteractionMood = input.InteractionMood,
                        InteractionMoodAt = input.InteractionMoodAt,
                        SortOrder = input.SortOrder
                    })
                    .ToList()
            })
            .ToList();

        var taskLog = new TaskLog
        {
            Id = taskLogId,
            UserId = userId,
            NagId = nagId,
            CopiedFromTaskLogId = copiedFromTaskLogId,
            ClosedOn = closedOn,
            Tag = tag,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            DescendantTaskItemCount = descendantTaskItemCount,
            DoneDescendantTaskItemCount = doneDescendantTaskItemCount,
            TaskItems = copiedTaskItems
        };

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        if (!await NagExistsAsync(connection, transaction, userId, taskLog.NagId, cancellationToken))
        {
            throw new NagValidationException("Nagger does not exist.");
        }

        if (taskLog.CopiedFromTaskLogId is { } copiedFromId
            && !await TaskLogExistsAsync(connection, transaction, userId, copiedFromId, cancellationToken))
        {
            throw new NagValidationException("CopiedFromTaskLog does not exist.");
        }

        var currentTaskLogHeader = await GetTaskLogHeaderAsync(
            connection,
            transaction,
            taskLog.Id,
            userId,
            cancellationToken);

        var exists = currentTaskLogHeader is not null;
        var isLateClosedTaskLogUpdate = currentTaskLogHeader?.ClosedOn is not null;

        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        if (!exists && baseVersion != 0)
        {
            throw new NagValidationException("BaseVersion must be 0 when creating a new TaskLog.");
        }

        taskLog = new TaskLog
        {
            Id = taskLog.Id,
            UserId = taskLog.UserId,
            NagId = taskLog.NagId,
            CopiedFromTaskLogId = taskLog.CopiedFromTaskLogId,
            ClosedOn = currentTaskLogHeader?.ClosedOn ?? taskLog.ClosedOn,
            Tag = taskLog.Tag,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            Version = nextVersion,
            DescendantTaskItemCount = taskLog.DescendantTaskItemCount,
            DoneDescendantTaskItemCount = taskLog.DoneDescendantTaskItemCount,
            TaskItems = taskLog.TaskItems
        };

        await UpsertTaskLogAsync(
            connection,
            transaction,
            taskLog,
            exists,
            baseVersion,
            currentTaskLogHeader?.Version,
            allowClosedUpdate: isLateClosedTaskLogUpdate,
            cancellationToken);

        await DeleteTaskEntriesAsync(
            connection,
            transaction,
            taskLog.Id,
            userId,
            cancellationToken);

        await DeleteTaskItemsAsync(
            connection,
            transaction,
            taskLog.Id,
            userId,
            cancellationToken);

        await InsertTaskLogTreeAsync(
            connection,
            transaction,
            taskLog,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return taskLog;
    }

    public async Task<TaskLogWriteResult> UpdateTaskEntryValuesAsync(
        Guid communityId,
        Guid userId,
        Guid taskLogId,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        int baseVersion,
        int nextVersion,
        IReadOnlyList<TaskEntryValueUpdateDto> taskEntries,
        CancellationToken cancellationToken = default)
    {
        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var taskLogIsOpen = await TaskLogIsOpenAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            cancellationToken);

        if (!taskLogIsOpen)
        {
            var currentVersion = await GetTaskLogVersionAsync(
                connection,
                transaction,
                userId,
                taskLogId,
                cancellationToken);

            throw new ConcurrencyConflictException(
                "TaskLog is closed and cannot accept input updates.",
                currentVersion);
        }

        var matchingInputCount = await CountTaskEntriesInTaskLogAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            taskEntries.Select(input => input.Id).ToArray(),
            cancellationToken);

        if (matchingInputCount != taskEntries.Count)
        {
            throw new NagValidationException("All TaskEntry updates must belong to the requested TaskLog.");
        }

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

        var storedVersion = await UpdateTaskLogVersionAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            baseVersion,
            nextVersion,
            updatedAt,
            clientIdentity,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new TaskLogWriteResult(
            storedVersion,
            updatedAt);
    }

    private static async Task<bool> TaskLogIsOpenAsync(
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

    private static async Task UpsertTaskLogAsync(
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

    private static async Task InsertTaskLogTreeAsync(
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

    private static async Task<int> CountTaskEntriesInTaskLogAsync(
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

    private static async Task<bool> NagExistsAsync(
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

    private static async Task<bool> TaskLogExistsAsync(
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

    private static async Task<int?> GetTaskLogVersionAsync(
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

    private static async Task<TaskLogHeader?> GetTaskLogHeaderAsync(
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

    private static async Task<int> UpdateTaskLogVersionAsync(
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
