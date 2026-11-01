using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Database.Connections;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Commands.Tags;

public sealed class TagWrite(GetDataDbConnection getDataDbConnection)
{
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
}
