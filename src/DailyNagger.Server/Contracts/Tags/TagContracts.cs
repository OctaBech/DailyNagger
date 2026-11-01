namespace DailyNagger.Server.Contracts.Tags;

public sealed record TagDto(
    string Name,
    string? Description,
    DateTimeOffset? LastUsedAt);

public sealed record SaveTagRequest(
    Guid CommunityId,
    Guid UserId,
    string TagType,
    string Name,
    string? Description);
