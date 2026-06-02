namespace DailyNagger.Server.Operations;

public sealed class NagCommunityNotFoundException(Guid communityId)
    : Exception($"NagCommunity was not found. NagCommunityId: {communityId}")
{
    public Guid CommunityId { get; } = communityId;
}
