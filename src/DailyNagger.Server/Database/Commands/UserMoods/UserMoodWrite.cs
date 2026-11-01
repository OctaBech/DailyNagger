using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Commands.UserMoods;

public sealed class UserMoodWrite(GetDataDbConnection getDataDbConnection)
{
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
                    and user_id = @userId
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
            throw new NagValidationException("UserMood does not exist for this user.");
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
}
