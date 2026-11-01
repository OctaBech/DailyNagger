using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Database.Connections;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Queries.Tags;

public sealed class TagRead(GetDataDbConnection getDataDbConnection)
{
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
}
