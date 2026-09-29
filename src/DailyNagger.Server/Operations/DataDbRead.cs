using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed class DataDbRead(GetDataDbConnection getDataDbConnection)
{
    public async Task<NagPlan> GetNagPlanAsync(
        Guid communityId,
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        var plan = new NagPlan
        {
            Date = date
        };

        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.user_id,
                nag.title,
                case
                    when task_log.closed_on is null then nag.active_log_due_on
                    else cast(task_log.closed_on as date)
                end,
                nag.expires_on,
                nag.target_time,
                nag.is_deactivated,
                nag.pinned_by,
                nag.updated_at,
                nag.updated_by_client_id,
                nag.updated_by_device_name,
                nag.updated_by_device_model,
                nag.version,
                task_log.id,
                task_log.user_id,
                task_log.copied_from_task_log_id,
                task_log.closed_on,
                task_log.tag,
                task_log.updated_at,
                task_log.updated_by_client_id,
                task_log.updated_by_device_name,
                task_log.updated_by_device_model,
                task_log.version,
                task_log.descendant_task_item_count,
                task_log.done_descendant_task_item_count
            from nag
            cross apply (
                select top 1
                    task_log.id,
                    task_log.user_id,
                    task_log.copied_from_task_log_id,
                    task_log.closed_on,
                    task_log.tag,
                    task_log.updated_at,
                    task_log.updated_by_client_id,
                    task_log.updated_by_device_name,
                    task_log.updated_by_device_model,
                    task_log.version,
                    task_log.descendant_task_item_count,
                    task_log.done_descendant_task_item_count
                from task_log
                where task_log.nag_id = nag.id
                    and task_log.user_id = @userId
                    and task_log.closed_on is null
                order by
                    task_log.id desc
            ) task_log
            where nag.user_id = @userId
                and nag.is_deactivated = 0
            order by nag.id
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                plan.Nags.Add(new NagPlanNagger
                {
                    Nagger = new Nagger
                    {
                        Id = reader.GetGuid(0),
                        UserId = reader.GetGuid(1),
                        Title = reader.GetString(2),
                        ActiveLogDueOn = reader.IsDBNull(3)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(3)),
                        ExpiresOn = reader.IsDBNull(4)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(4)),
                        TargetTime = reader.IsDBNull(5)
                            ? null
                            : TimeOnly.FromTimeSpan(reader.GetTimeSpan(5)),
                        IsDeactivated = reader.GetBoolean(6),
                        PinnedBy = Enum.Parse<NaggerPinnedBy>(reader.GetString(7)),
                        UpdatedAt = reader.GetDateTimeOffset(8),
                        UpdatedByClientId = reader.IsDBNull(9) ? null : reader.GetString(9),
                        UpdatedByDeviceName = reader.IsDBNull(10) ? null : reader.GetString(10),
                        UpdatedByDeviceModel = reader.IsDBNull(11) ? null : reader.GetString(11),
                        Version = reader.GetInt32(12)
                    },
                    TaskLog = new TaskLog
                    {
                        Id = reader.GetGuid(13),
                        UserId = reader.GetGuid(14),
                        NagId = reader.GetGuid(0),
                        CopiedFromTaskLogId = reader.IsDBNull(15) ? null : reader.GetGuid(15),
                        ClosedOn = reader.IsDBNull(16) ? null : reader.GetDateTimeOffset(16),
                        Tag = reader.IsDBNull(17) ? null : reader.GetString(17),
                        UpdatedAt = reader.GetDateTimeOffset(18),
                        UpdatedByClientId = reader.IsDBNull(19) ? null : reader.GetString(19),
                        UpdatedByDeviceName = reader.IsDBNull(20) ? null : reader.GetString(20),
                        UpdatedByDeviceModel = reader.IsDBNull(21) ? null : reader.GetString(21),
                        Version = reader.GetInt32(22),
                        DescendantTaskItemCount = reader.GetInt32(23),
                        DoneDescendantTaskItemCount = reader.GetInt32(24)
                    }
                });
            }
        }

        foreach (var item in plan.Nags)
        {
            item.Nagger.ScheduleRules.AddRange(await GetScheduleRulesAsync(
                connection,
                userId,
                item.Nagger.Id,
                cancellationToken));

            item.TaskLog.TaskItems.AddRange(await GetTaskItemsAsync(
                connection,
                userId,
                item.TaskLog.Id,
                cancellationToken));
        }

        return plan;
    }

    public async Task<IReadOnlyList<TaskStepNameSuggestionDto>> GetTaskStepNameSuggestionsAsync(
        Guid communityId,
        Guid userId,
        Guid naggerId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select distinct
                task_item.name
            from task_item
            inner join task_log on task_log.id = task_item.task_log_id
            where task_log.nag_id = @naggerId
              and task_log.user_id = @userId
              and task_item.user_id = @userId
              and task_item.name <> ''
            order by task_item.name
            """,
            connection);

        command.Parameters.AddWithValue("@naggerId", naggerId);
        command.Parameters.AddWithValue("@userId", userId);

        var suggestions = new List<TaskStepNameSuggestionDto>();

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            suggestions.Add(new TaskStepNameSuggestionDto(reader.GetString(0)));
        }

        return suggestions;
    }

    public async Task<IReadOnlyList<Nagger>> GetNagAsync(
        Guid communityId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.user_id,
                nag.title,
                nag.active_log_due_on,
                nag.expires_on,
                nag.target_time,
                nag.is_deactivated,
                nag.pinned_by,
                nag.updated_at,
                nag.updated_by_client_id,
                nag.updated_by_device_name,
                nag.updated_by_device_model,
                nag.version
            from nag
            where nag.user_id = @userId
            order by nag.id
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);

        var nag = new List<Nagger>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nag.Add(new Nagger
                {
                    Id = reader.GetGuid(0),
                    UserId = reader.GetGuid(1),
                    Title = reader.GetString(2),
                    ActiveLogDueOn = reader.IsDBNull(3)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(3)),
                    ExpiresOn = reader.IsDBNull(4)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(4)),
                    TargetTime = reader.IsDBNull(5)
                        ? null
                        : TimeOnly.FromTimeSpan(reader.GetTimeSpan(5)),
                    IsDeactivated = reader.GetBoolean(6),
                    PinnedBy = Enum.Parse<NaggerPinnedBy>(reader.GetString(7)),
                    UpdatedAt = reader.GetDateTimeOffset(8),
                    UpdatedByClientId = reader.IsDBNull(9) ? null : reader.GetString(9),
                    UpdatedByDeviceName = reader.IsDBNull(10) ? null : reader.GetString(10),
                    UpdatedByDeviceModel = reader.IsDBNull(11) ? null : reader.GetString(11),
                    Version = reader.GetInt32(12)
                });
            }
        }

        foreach (var item in nag)
        {
            item.ScheduleRules.AddRange(await GetScheduleRulesAsync(
                connection,
                userId,
                item.Id,
                cancellationToken));
        }

        return nag;
    }

    public async Task<IReadOnlyList<TagDto>> GetTagsAsync(
        Guid communityId,
        Guid userId,
        string tagType,
        CancellationToken cancellationToken = default)
    {
        tagType = tagType.Trim();

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select
                name,
                description,
                last_used_at
            from user_tag
            where user_id = @userId
                and tag_type = @tagType
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@tagType", tagType);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var tags = new List<TagDto>();

        while (await reader.ReadAsync(cancellationToken))
        {
            tags.Add(new TagDto(
                reader.GetString(0),
                reader.IsDBNull(1) ? null : reader.GetString(1),
                reader.IsDBNull(2) ? null : reader.GetDateTimeOffset(2)));
        }

        return tags;
    }

    public async Task<IReadOnlyList<UserMoodDto>> GetUserMoodsAsync(
        Guid communityId,
        Guid userId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int take,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select top (@take)
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
            where user_id = @userId
                and (@from is null or recorded_at >= @from)
                and (@to is null or recorded_at <= @to)
            order by recorded_at desc, created_at desc, id
            """,
            connection);

        command.Parameters.AddWithValue("@userId", userId);
        command.Parameters.AddWithValue("@from", (object?)from ?? DBNull.Value);
        command.Parameters.AddWithValue("@to", (object?)to ?? DBNull.Value);
        command.Parameters.AddWithValue("@take", take);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var moods = new List<UserMoodDto>();

        while (await reader.ReadAsync(cancellationToken))
        {
            moods.Add(new UserMoodDto(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetDateTimeOffset(3),
                reader.IsDBNull(4) ? null : reader.GetString(4),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.GetDateTimeOffset(6),
                reader.IsDBNull(7) ? null : reader.GetString(7),
                reader.IsDBNull(8) ? null : reader.GetString(8),
                reader.IsDBNull(9) ? null : reader.GetString(9)));
        }

        return moods;
    }

    private static async Task<IReadOnlyList<TaskItem>> GetTaskItemsAsync(
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

        foreach (var node in nodes)
        {
            node.TaskEntries.AddRange(await GetTaskEntriesAsync(
                connection,
                userId,
                taskLogId,
                node.Id,
                cancellationToken));
        }

        return nodes;
    }

    private static async Task<IReadOnlyList<TaskEntry>> GetTaskEntriesAsync(
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

    private static async Task<IReadOnlyList<ScheduleRule>> GetScheduleRulesAsync(
        SqlConnection connection,
        Guid userId,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select id, user_id, rule_type, rule_json
            from schedule_rule
            where nag_id = @nagId
                and user_id = @userId
            order by id
            """,
            connection);

        command.Parameters.AddWithValue("@nagId", nagId);
        command.Parameters.AddWithValue("@userId", userId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var rules = new List<ScheduleRule>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var storedRuleType = reader.GetString(2);

            rules.Add(new ScheduleRule
            {
                Id = reader.GetGuid(0),
                UserId = reader.GetGuid(1),
                NagId = nagId,
                RuleType = Enum.Parse<ScheduleRuleType>(storedRuleType),
                RuleJson = reader.GetString(3)
            });
        }

        return rules;
    }
}
