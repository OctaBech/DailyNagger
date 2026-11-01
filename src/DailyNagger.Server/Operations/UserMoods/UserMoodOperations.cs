using DailyNagger.Server.Contracts.UserMoods;

namespace DailyNagger.Server.Operations.UserMoods;

public sealed class UserMoodOperations(UserMoodRead read, UserMoodWrite write)
{
    public Task<IReadOnlyList<UserMoodDto>> GetAsync(
        Guid communityId,
        Guid userId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int take,
        CancellationToken cancellationToken = default)
    {
        return read.GetUserMoodsAsync(communityId, userId, from, to, take, cancellationToken);
    }

    public Task<UserMoodDto> SaveAsync(
        SaveUserMoodRequest request,
        CancellationToken cancellationToken = default)
    {
        return write.SaveUserMoodAsync(
            request.CommunityId,
            request.UserId,
            request.Payload.Id,
            request.Payload.Mood,
            request.Payload.RecordedAt,
            request.Payload.TimeZone,
            request.Payload.Locale,
            request.ClientIdentity,
            cancellationToken);
    }
}
