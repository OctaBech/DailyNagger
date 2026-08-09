using System.Text;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed record TaskLogWriteResult(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed class DataDbWrite(GetDataDbConnection getDataDbConnection)
{
    private sealed record TaskLogHeader(
        Guid Id,
        DateTimeOffset? ClosedOn,
        int Version);

    public async Task<TagDto> SaveTagAsync(
        Guid communityId,
        Guid userId,
        string tagType,
        string name,
        string? description,
        CancellationToken cancellationToken = default)
    {
        tagType = tagType.Trim();
        name = name.Trim();
        description = string.IsNullOrWhiteSpace(description)
            ? null
            : description.Trim();
        var lastUsedAt = DateTimeOffset.UtcNow;

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            update user_tag
            set
                description = @description,
                last_used_at = @lastUsedAt
            where user_id = @userId
                and tag_type = @tagType
                and name = @name

            if @@ROWCOUNT = 0
            begin
                insert into user_tag (
                    user_id,
                    tag_type,
                    name,
                    description,
                    last_used_at
                )
                values (
                    @userId,
                    @tagType,
                    @name,
                    @description,
                    @lastUsedAt
                )
            end

            select
                name,
                description,
                last_used_at
            from user_tag
            where user_id = @userId
                and tag_type = @tagType
                and name = @name
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@tagType", tagType);
        command.Parameters.AddWithValue("@name", name);
        command.Parameters.AddWithValue("@description", (object?)description ?? DBNull.Value);
        command.Parameters.AddWithValue("@lastUsedAt", lastUsedAt);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("Saved tag could not be read back.");
        }

        return new TagDto(
            reader.GetString(0),
            reader.IsDBNull(1) ? null : reader.GetString(1),
            reader.IsDBNull(2) ? null : reader.GetDateTimeOffset(2));
    }

    public async Task<UserMoodDto> SaveUserMoodAsync(
        Guid communityId,
        Guid userId,
        Guid id,
        string mood,
        DateTimeOffset recordedAt,
        string? timeZone,
        string? locale,
        ClientIdentityDto? clientIdentity,
        CancellationToken cancellationToken = default)
    {
        mood = mood.Trim();
        timeZone = string.IsNullOrWhiteSpace(timeZone)
            ? null
            : timeZone.Trim();
        locale = string.IsNullOrWhiteSpace(locale)
            ? null
            : locale.Trim();
        var createdAt = DateTimeOffset.UtcNow;

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            if not exists (
                select 1
                from user_mood
                where id = @id
            )
            begin
                insert into user_mood (
                    id,
                    user_id,
                    mood,
                    recorded_at,
                    time_zone,
                    locale,
                    created_at,
                    created_by_client_id,
                    created_by_device_name,
                    created_by_device_model
                )
                values (
                    @id,
                    @userId,
                    @mood,
                    @recordedAt,
                    @timeZone,
                    @locale,
                    @createdAt,
                    @createdByClientId,
                    @createdByDeviceName,
                    @createdByDeviceModel
                )
            end

            select
                id,
                user_id,
                mood,
                recorded_at,
                time_zone,
                locale,
                created_at,
                created_by_client_id,
                created_by_device_name,
                created_by_device_model
            from user_mood
            where id = @id
                and user_id = @userId
            """,
            connection);

        command.Parameters.AddWithValue("@id", id);
        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@mood", mood);
        command.Parameters.AddWithValue("@recordedAt", recordedAt);
        command.Parameters.AddWithValue("@timeZone", (object?)timeZone ?? DBNull.Value);
        command.Parameters.AddWithValue("@locale", (object?)locale ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdAt", createdAt);
        command.Parameters.AddWithValue("@createdByClientId", (object?)clientIdentity?.ClientId ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdByDeviceName", (object?)clientIdentity?.DeviceName ?? DBNull.Value);
        command.Parameters.AddWithValue("@createdByDeviceModel", (object?)clientIdentity?.DeviceModel ?? DBNull.Value);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("Saved user mood could not be read back.");
        }

        return new UserMoodDto(
            reader.GetGuid(0),
            reader.GetGuid(1),
            reader.GetString(2),
            reader.GetDateTimeOffset(3),
            reader.IsDBNull(4) ? null : reader.GetString(4),
            reader.IsDBNull(5) ? null : reader.GetString(5),
            reader.GetDateTimeOffset(6),
            reader.IsDBNull(7) ? null : reader.GetString(7),
            reader.IsDBNull(8) ? null : reader.GetString(8),
            reader.IsDBNull(9) ? null : reader.GetString(9));
    }

    public async Task<Nagger> SaveNagAsync(
        Guid communityId,
        Guid nagId,
        string title,
        DateOnly? activeLogDueOn,
        DateOnly? expiresOn,
        TimeOnly? targetTime,
        bool isDeactivated,
        NaggerPinnedBy pinnedBy,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        IReadOnlyList<ScheduleRule> scheduleRules,
        int baseVersion,
        int nextVersion,
        CancellationToken cancellationToken = default)
    {
        var copiedScheduleRules = scheduleRules
            .Select(rule => new ScheduleRule
            {
                Id = rule.Id,
                NagId = nagId,
                RuleType = rule.RuleType,
                Day = rule.Day,
                Month = rule.Month,
                Year = rule.Year
            })
            .ToList();

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var currentVersion = await GetNagVersionAsync(
            connection,
            transaction,
            nagId,
            cancellationToken);

        var nag = new Nagger
        {
            Id = nagId,
            Title = title,
            ActiveLogDueOn = activeLogDueOn,
            ExpiresOn = expiresOn,
            TargetTime = targetTime,
            IsDeactivated = isDeactivated,
            PinnedBy = pinnedBy,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            Version = nextVersion,
            ScheduleRules = copiedScheduleRules
        };

        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        if (currentVersion is null && baseVersion != 0)
        {
            throw new ConcurrencyConflictException("New Nagger requires baseVersion 0.");
        }

        await using var command = new SqlCommand(
            currentVersion is not null
                ? """
                  update nag
                  set
                      title = @title,
                      active_log_due_on = @activeLogDueOn,
                      expires_on = @expiresOn,
                      target_time = @targetTime,
                      is_deactivated = @isDeactivated,
                      pinned_by = @pinnedBy,
                      updated_at = @updatedAt,
                      updated_by_client_id = @updatedByClientId,
                      updated_by_device_name = @updatedByDeviceName,
                      updated_by_device_model = @updatedByDeviceModel,
                      version = @version
                  where id = @id
                      and version = @baseVersion
                  """
                : """
                  insert into nag (
                      id,
                      title,
                      active_log_due_on,
                      expires_on,
                      target_time,
                      is_deactivated,
                      pinned_by,
                      updated_at,
                      updated_by_client_id,
                      updated_by_device_name,
                      updated_by_device_model,
                      version)
                  values (
                      @id,
                      @title,
                      @activeLogDueOn,
                      @expiresOn,
                      @targetTime,
                      @isDeactivated,
                      @pinnedBy,
                      @updatedAt,
                      @updatedByClientId,
                      @updatedByDeviceName,
                      @updatedByDeviceModel,
                      @version)
                  """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nag.Id);
        command.Parameters.AddWithValue("@title", nag.Title);
        command.Parameters.AddWithValue("@activeLogDueOn", (object?)nag.ActiveLogDueOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@expiresOn", (object?)nag.ExpiresOn ?? DBNull.Value);
        command.Parameters.AddWithValue("@targetTime", (object?)nag.TargetTime?.ToTimeSpan() ?? DBNull.Value);
        command.Parameters.AddWithValue("@isDeactivated", nag.IsDeactivated);
        command.Parameters.AddWithValue("@pinnedBy", nag.PinnedBy.ToString());
        command.Parameters.AddWithValue("@updatedAt", nag.UpdatedAt);
        command.Parameters.AddWithValue("@updatedByClientId", (object?)nag.UpdatedByClientId ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceName", (object?)nag.UpdatedByDeviceName ?? DBNull.Value);
        command.Parameters.AddWithValue("@updatedByDeviceModel", (object?)nag.UpdatedByDeviceModel ?? DBNull.Value);
        command.Parameters.AddWithValue("@version", nag.Version);
        command.Parameters.AddWithValue("@baseVersion", baseVersion);

        var changedRows = await command.ExecuteNonQueryAsync(cancellationToken);
        if (changedRows == 0)
        {
            throw new ConcurrencyConflictException(
                "Nagger version conflict.",
                currentVersion);
        }

        await using var deleteScheduleRulesCommand = new SqlCommand(
            """
            delete from schedule_rule
            where nag_id = @nagId
            """,
            connection,
            transaction);

        deleteScheduleRulesCommand.Parameters.AddWithValue("@nagId", nag.Id);

        await deleteScheduleRulesCommand.ExecuteNonQueryAsync(cancellationToken);

        foreach (var rule in nag.ScheduleRules)
        {
            await using var ruleCommand = new SqlCommand(
                """
                insert into schedule_rule
                    (id, nag_id, rule_type, day, month, year)
                values
                    (@id, @nagId, @ruleType, @day, @month, @year)
                """,
                connection,
                transaction);

            ruleCommand.Parameters.AddWithValue("@id", rule.Id);
            ruleCommand.Parameters.AddWithValue("@nagId", nag.Id);
            ruleCommand.Parameters.AddWithValue("@ruleType", rule.RuleType.ToString());
            ruleCommand.Parameters.AddWithValue("@day", (object?)rule.Day ?? DBNull.Value);
            ruleCommand.Parameters.AddWithValue("@month", (object?)rule.Month ?? DBNull.Value);
            ruleCommand.Parameters.AddWithValue("@year", (object?)rule.Year ?? DBNull.Value);
            await ruleCommand.ExecuteNonQueryAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);

        return nag;
    }

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

        if (!await NagExistsAsync(connection, transaction, taskLog.NagId, cancellationToken))
        {
            throw new NagValidationException("Nagger does not exist.");
        }

        var currentTaskLogHeader = await GetTaskLogHeaderAsync(
            connection,
            transaction,
            taskLog.Id,
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
            cancellationToken);

        await DeleteTaskItemsAsync(
            connection,
            transaction,
            taskLog.Id,
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
            taskLogId,
            cancellationToken);

        if (!taskLogIsOpen)
        {
            var currentVersion = await GetTaskLogVersionAsync(
                connection,
                transaction,
                taskLogId,
                cancellationToken);

            throw new ConcurrencyConflictException(
                "TaskLog is closed and cannot accept input updates.",
                currentVersion);
        }

        var matchingInputCount = await CountTaskEntriesInTaskLogAsync(
            connection,
            transaction,
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
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@id", input.Id);
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
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select count(*)
            from task_log
            where id = @taskLogId
                and closed_on is null
            """,
            connection,
            transaction);

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
                          and version = @baseVersion
                          and closed_on is null
                      """
                : """
                  insert into task_log (
                      id,
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
                and task_entry.id in ({string.Join(", ", parameterNames)})
            """,
            connection,
            transaction);

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
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            delete task_entry
            from task_entry
            where task_entry.task_log_id = @taskLogId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static async Task DeleteTaskItemsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        while (true)
        {
            await using var command = new SqlCommand(
                """
                delete from task_item
                where task_log_id = @taskLogId
                    and not exists (
                        select 1
                        from task_item child
                        where child.parent_task_item_id = task_item.id
                    )
                """,
                connection,
                transaction);

            command.Parameters.AddWithValue("@taskLogId", taskLogId);

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
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select 1
            from nag
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);

        return await command.ExecuteScalarAsync(cancellationToken) is not null;
    }

    private static async Task<int?> GetNagVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from nag
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null or DBNull ? null : (int)result;
    }

    private static async Task<int?> GetTaskLogVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from task_log
            where id = @id
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null ? null : (int)result;
    }

    private static async Task<TaskLogHeader?> GetTaskLogHeaderAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid taskLogId,
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
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);

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
                and version = @baseVersion
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", taskLogId);
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
                taskLogId,
                cancellationToken);

            throw new ConcurrencyConflictException(
                "TaskLog version conflict.",
                currentVersion);
        }

        return (int)result;
    }
}
