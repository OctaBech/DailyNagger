using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Data.Connections;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.UserMoods;

public sealed class UserMoodRead(GetDataDbConnection getDataDbConnection)
{
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
}
