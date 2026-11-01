using DailyNagger.Server.Contracts.UserMoods;
using DailyNagger.Server.Database;

namespace DailyNagger.Server.Operations.UserMoods;

public sealed class UserMoodOperations(DatabaseQueries queries, DatabaseCommands commands)
{
    public Task<IReadOnlyList<UserMoodDto>> GetAsync(
        Guid communityId,
        Guid userId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        int take,
        CancellationToken cancellationToken = default)
    {
        return queries.UserMoods.GetUserMoodsAsync(communityId, userId, from, to, take, cancellationToken);
    }

    public Task<UserMoodDto> SaveAsync(
        SaveUserMoodRequest request,
        CancellationToken cancellationToken = default)
    {
        return commands.UserMoods.SaveUserMoodAsync(
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
