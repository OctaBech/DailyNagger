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
                order by
                    case when task_log.closed_on is null then 0 else 1 end,
                    task_log.closed_on desc,
                    task_log.id desc
            ) task_log
            where nag.is_deactivated = 0
            order by nag.id
            """,
            connection);

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                plan.Nags.Add(new NagPlanNagger
                {
                    Nagger = new Nagger
                    {
                        Id = reader.GetGuid(0),
                        Title = reader.GetString(1),
                        ActiveLogDueOn = reader.IsDBNull(2)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(2)),
                        ExpiresOn = reader.IsDBNull(3)
                            ? null
                            : DateOnly.FromDateTime(reader.GetDateTime(3)),
                        TargetTime = reader.IsDBNull(4)
                            ? null
                            : TimeOnly.FromTimeSpan(reader.GetTimeSpan(4)),
                        IsDeactivated = reader.GetBoolean(5),
                        PinnedBy = Enum.Parse<NaggerPinnedBy>(reader.GetString(6)),
                        UpdatedAt = reader.GetDateTimeOffset(7),
                        UpdatedByClientId = reader.IsDBNull(8) ? null : reader.GetString(8),
                        UpdatedByDeviceName = reader.IsDBNull(9) ? null : reader.GetString(9),
                        UpdatedByDeviceModel = reader.IsDBNull(10) ? null : reader.GetString(10),
                        Version = reader.GetInt32(11)
                    },
                    TaskLog = new TaskLog
                    {
                        Id = reader.GetGuid(12),
                        NagId = reader.GetGuid(0),
                        CopiedFromTaskLogId = reader.IsDBNull(13) ? null : reader.GetGuid(13),
                        ClosedOn = reader.IsDBNull(14) ? null : reader.GetDateTimeOffset(14),
                        Tag = reader.IsDBNull(15) ? null : reader.GetString(15),
                        UpdatedAt = reader.GetDateTimeOffset(16),
                        UpdatedByClientId = reader.IsDBNull(17) ? null : reader.GetString(17),
                        UpdatedByDeviceName = reader.IsDBNull(18) ? null : reader.GetString(18),
                        UpdatedByDeviceModel = reader.IsDBNull(19) ? null : reader.GetString(19),
                        Version = reader.GetInt32(20),
                        DescendantTaskItemCount = reader.GetInt32(21),
                        DoneDescendantTaskItemCount = reader.GetInt32(22)
                    }
                });
            }
        }

        foreach (var item in plan.Nags)
        {
            item.Nagger.ScheduleRules.AddRange(await GetScheduleRulesAsync(
                connection,
                item.Nagger.Id,
                cancellationToken));

            item.TaskLog.TaskItems.AddRange(await GetTaskItemsAsync(
                connection,
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
              and task_item.name <> ''
            order by task_item.name
            """,
            connection);

        command.Parameters.AddWithValue("@naggerId", naggerId);

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
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            """
            select
                nag.id,
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
            order by nag.id
            """,
            connection);

        var nag = new List<Nagger>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nag.Add(new Nagger
                {
                    Id = reader.GetGuid(0),
                    Title = reader.GetString(1),
                    ActiveLogDueOn = reader.IsDBNull(2)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(2)),
                    ExpiresOn = reader.IsDBNull(3)
                        ? null
                        : DateOnly.FromDateTime(reader.GetDateTime(3)),
                    TargetTime = reader.IsDBNull(4)
                        ? null
                        : TimeOnly.FromTimeSpan(reader.GetTimeSpan(4)),
                    IsDeactivated = reader.GetBoolean(5),
                    PinnedBy = Enum.Parse<NaggerPinnedBy>(reader.GetString(6)),
                    UpdatedAt = reader.GetDateTimeOffset(7),
                    UpdatedByClientId = reader.IsDBNull(8) ? null : reader.GetString(8),
                    UpdatedByDeviceName = reader.IsDBNull(9) ? null : reader.GetString(9),
                    UpdatedByDeviceModel = reader.IsDBNull(10) ? null : reader.GetString(10),
                    Version = reader.GetInt32(11)
                });
            }
        }

        foreach (var item in nag)
        {
            item.ScheduleRules.AddRange(await GetScheduleRulesAsync(
                connection,
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
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
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
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);

        var nodes = new List<TaskItem>();

        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                nodes.Add(new TaskItem
                {
                    Id = reader.GetGuid(0),
                    TaskLogId = taskLogId,
                    ParentTaskItemId = reader.IsDBNull(1) ? null : reader.GetGuid(1),
                    Name = reader.GetString(2),
                    Tag = reader.IsDBNull(3) ? null : reader.GetString(3),
                    IsDone = reader.GetBoolean(4),
                    InteractionAt = reader.IsDBNull(5) ? null : reader.GetDateTimeOffset(5),
                    InteractionTimeZone = reader.IsDBNull(6) ? null : reader.GetString(6),
                    InteractionLocale = reader.IsDBNull(7) ? null : reader.GetString(7),
                    InteractionMood = reader.IsDBNull(8) ? null : reader.GetString(8),
                    InteractionMoodAt = reader.IsDBNull(9) ? null : reader.GetDateTimeOffset(9),
                    RolloverBehavior = Enum.Parse<RolloverBehavior>(reader.GetString(10)),
                    DescendantTaskItemCount = reader.GetInt32(11),
                    DoneDescendantTaskItemCount = reader.GetInt32(12),
                    SortOrder = reader.GetInt32(13)
                });
            }
        }

        foreach (var node in nodes)
        {
            node.TaskEntries.AddRange(await GetTaskEntriesAsync(
                connection,
                taskLogId,
                node.Id,
                cancellationToken));
        }

        return nodes;
    }

    private static async Task<IReadOnlyList<TaskEntry>> GetTaskEntriesAsync(
        SqlConnection connection,
        Guid taskLogId,
        Guid parentTaskItemId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                id,
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
                and parent_task_item_id = @parentTaskItemId
            order by sort_order, id
            """,
            connection);

        command.Parameters.AddWithValue("@taskLogId", taskLogId);
        command.Parameters.AddWithValue("@parentTaskItemId", parentTaskItemId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var inputs = new List<TaskEntry>();

        while (await reader.ReadAsync(cancellationToken))
        {
            inputs.Add(new TaskEntry
            {
                Id = reader.GetGuid(0),
                TaskLogId = taskLogId,
                ParentTaskItemId = parentTaskItemId,
                Label = reader.GetString(1),
                Description = reader.IsDBNull(2) ? null : reader.GetString(2),
                ValueType = Enum.Parse<TaskEntryValueType>(reader.GetString(3)),
                Tag = reader.IsDBNull(4) ? null : reader.GetString(4),
                Value = reader.IsDBNull(5) ? null : reader.GetString(5),
                LastTaskRunReferenceValue = reader.IsDBNull(6) ? null : reader.GetString(6),
                RolloverBehavior = Enum.Parse<RolloverBehavior>(reader.GetString(7)),
                InteractionAt = reader.IsDBNull(8) ? null : reader.GetDateTimeOffset(8),
                InteractionTimeZone = reader.IsDBNull(9) ? null : reader.GetString(9),
                InteractionLocale = reader.IsDBNull(10) ? null : reader.GetString(10),
                InteractionMood = reader.IsDBNull(11) ? null : reader.GetString(11),
                InteractionMoodAt = reader.IsDBNull(12) ? null : reader.GetDateTimeOffset(12),
                SortOrder = reader.GetInt32(13)
            });
        }

        return inputs;
    }

    private static async Task<IReadOnlyList<ScheduleRule>> GetScheduleRulesAsync(
        SqlConnection connection,
        Guid nagId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select id, rule_type, day, month, year
            from schedule_rule
            where nag_id = @nagId
            order by id
            """,
            connection);

        command.Parameters.AddWithValue("@nagId", nagId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var rules = new List<ScheduleRule>();

        while (await reader.ReadAsync(cancellationToken))
        {
            var storedRuleType = reader.GetString(1);

            rules.Add(new ScheduleRule
            {
                Id = reader.GetGuid(0),
                NagId = nagId,
                RuleType = Enum.Parse<ScheduleRuleType>(storedRuleType),
                Day = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                Month = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                Year = reader.IsDBNull(4) ? null : reader.GetInt32(4)
            });
        }

        return rules;
    }
}
