using DailyNagger.Server.Database.Models.Control;
namespace DailyNagger.Server.Database.Connections;

public sealed class NagCommunityNotFoundException(Guid communityId)
    : Exception($"NagCommunity was not found. NagCommunityId: {communityId}")
{
    public Guid CommunityId { get; } = communityId;
}
