using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Queries.Nags;

internal static class NagQueries
{
    public static async Task<IReadOnlyList<Nagger>> GetNagsAsync(
        SqlConnection connection,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select
                nag.id,
                nag.user_id,
                nag.title,
                nag.active_log_due_on,
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

        return nag;
    }

    public static async Task<IReadOnlyList<TaskStepNameSuggestionDto>> GetTaskStepNameSuggestionsAsync(
        SqlConnection connection,
        Guid userId,
        Guid naggerId,
        CancellationToken cancellationToken)
    {
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

    public static async Task<IReadOnlyList<ScheduleRule>> GetScheduleRulesAsync(
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
