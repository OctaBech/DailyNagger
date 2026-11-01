using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Queries.NagPlans;

internal static class NagPlanQueries
{
    public static async Task<IReadOnlyList<NagPlanNagger>> GetNagsAsync(
        SqlConnection connection,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var nags = new List<NagPlanNagger>();

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
                nags.Add(new NagPlanNagger
                {
                    Nagger = new Nagger
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
                    },
                    TaskLog = new TaskLog
                    {
                        Id = reader.GetGuid(12),
                        UserId = reader.GetGuid(13),
                        NagId = reader.GetGuid(0),
                        CopiedFromTaskLogId = reader.IsDBNull(14) ? null : reader.GetGuid(14),
                        ClosedOn = reader.IsDBNull(15) ? null : reader.GetDateTimeOffset(15),
                        Tag = reader.IsDBNull(16) ? null : reader.GetString(16),
                        UpdatedAt = reader.GetDateTimeOffset(17),
                        UpdatedByClientId = reader.IsDBNull(18) ? null : reader.GetString(18),
                        UpdatedByDeviceName = reader.IsDBNull(19) ? null : reader.GetString(19),
                        UpdatedByDeviceModel = reader.IsDBNull(20) ? null : reader.GetString(20),
                        Version = reader.GetInt32(21),
                        DescendantTaskItemCount = reader.GetInt32(22),
                        DoneDescendantTaskItemCount = reader.GetInt32(23)
                    }
                });
            }
        }

        return nags;
    }
}
