using DailyNagger.Server.Contracts.Tags;
using DailyNagger.Server.Database;

namespace DailyNagger.Server.Operations.Tags;

public sealed class TagOperations(DatabaseQueries queries, DatabaseCommands commands)
{
    public Task<IReadOnlyList<TagDto>> GetAsync(
        Guid communityId,
        Guid userId,
        string tagType,
        CancellationToken cancellationToken = default)
    {
        return queries.Tags.GetTagsAsync(communityId, userId, tagType, cancellationToken);
    }

    public Task<TagDto> SaveAsync(
        SaveTagRequest request,
        CancellationToken cancellationToken = default)
    {
        return commands.Tags.SaveTagAsync(
            request.CommunityId,
            request.UserId,
            request.TagType,
            request.Name,
            request.Description,
            cancellationToken);
    }
}
