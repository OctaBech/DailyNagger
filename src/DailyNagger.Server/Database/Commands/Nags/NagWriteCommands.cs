using DailyNagger.Server.Domain.Tenant;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Commands.Nags;

internal static class NagWriteCommands
{
    public static async Task<int> UpsertAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Nagger nag,
        int? currentVersion,
        int baseVersion,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            currentVersion is not null
                ? """
                  update nag
                  set
                      title = @title,
                      active_log_due_on = @activeLogDueOn,
                      target_time = @targetTime,
                      is_deactivated = @isDeactivated,
                      pinned_by = @pinnedBy,
                      updated_at = @updatedAt,
                      updated_by_client_id = @updatedByClientId,
                      updated_by_device_name = @updatedByDeviceName,
                      updated_by_device_model = @updatedByDeviceModel,
                      version = @version
                  where id = @id
                      and user_id = @userId
                      and version = @baseVersion
                  """
                : """
                  insert into nag (
                      id,
                      user_id,
                      title,
                      active_log_due_on,
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
                      @userId,
                      @title,
                      @activeLogDueOn,
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
        command.Parameters.AddWithValue("@userId", nag.UserId);
        command.Parameters.AddWithValue("@title", nag.Title);
        command.Parameters.AddWithValue("@activeLogDueOn", (object?)nag.ActiveLogDueOn ?? DBNull.Value);
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
        return changedRows;
    }

    public static async Task ReplaceScheduleRulesAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Nagger nag,
        CancellationToken cancellationToken)
    {
        await using var deleteScheduleRulesCommand = new SqlCommand(
            """
            delete from schedule_rule
            where nag_id = @nagId
                and user_id = @userId
            """,
            connection,
            transaction);

        deleteScheduleRulesCommand.Parameters.AddWithValue("@nagId", nag.Id);
        deleteScheduleRulesCommand.Parameters.AddWithValue("@userId", nag.UserId);

        await deleteScheduleRulesCommand.ExecuteNonQueryAsync(cancellationToken);

        foreach (var rule in nag.ScheduleRules)
        {
            await using var ruleCommand = new SqlCommand(
                """
                insert into schedule_rule
                    (id, user_id, nag_id, rule_type, rule_json)
                values
                    (@id, @userId, @nagId, @ruleType, @ruleJson)
                """,
                connection,
                transaction);

            ruleCommand.Parameters.AddWithValue("@id", rule.Id);
            ruleCommand.Parameters.AddWithValue("@userId", rule.UserId);
            ruleCommand.Parameters.AddWithValue("@nagId", nag.Id);
            ruleCommand.Parameters.AddWithValue("@ruleType", rule.RuleType.ToString());
            ruleCommand.Parameters.AddWithValue("@ruleJson", rule.RuleJson);
            await ruleCommand.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    public static async Task<int?> GetNagVersionAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        Guid nagId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(
            """
            select version
            from nag
            where id = @id
                and user_id = @userId
            """,
            connection,
            transaction);

        command.Parameters.AddWithValue("@id", nagId);
        command.Parameters.AddWithValue("@userId", userId);

        var result = await command.ExecuteScalarAsync(cancellationToken);

        return result is null or DBNull ? null : (int)result;
    }
}
