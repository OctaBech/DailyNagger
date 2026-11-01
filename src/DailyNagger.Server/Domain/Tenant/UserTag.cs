namespace DailyNagger.Server.Domain.Tenant;

public sealed class UserTag
{
    public Guid UserId { get; init; }
    public required string TagType { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
    public DateTimeOffset? LastUsedAt { get; init; }
}
