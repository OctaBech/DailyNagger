using DailyNagger.Server.Contracts.Tags;

namespace DailyNagger.Server.Operations.Tags;

public sealed class TagOperations(TagRead read, TagWrite write)
{
    public Task<IReadOnlyList<TagDto>> GetAsync(
        Guid communityId,
        Guid userId,
        string tagType,
        CancellationToken cancellationToken = default)
    {
        return read.GetTagsAsync(communityId, userId, tagType, cancellationToken);
    }

    public Task<TagDto> SaveAsync(
        SaveTagRequest request,
        CancellationToken cancellationToken = default)
    {
        return write.SaveTagAsync(
            request.CommunityId,
            request.UserId,
            request.TagType,
            request.Name,
            request.Description,
            cancellationToken);
    }
}
