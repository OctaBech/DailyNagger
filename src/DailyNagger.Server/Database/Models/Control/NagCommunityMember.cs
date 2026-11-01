namespace DailyNagger.Server.Database.Models.Control;

public sealed class NagCommunityMember
{
    public Guid NagCommunityId { get; init; }

    public Guid UserId { get; init; }
}
