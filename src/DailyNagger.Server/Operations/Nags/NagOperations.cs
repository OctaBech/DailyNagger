using DailyNagger.Server.Contracts;
using DailyNagger.Server.Database;

namespace DailyNagger.Server.Operations.Nags;

public sealed class NagOperations(DatabaseQueries queries, DatabaseCommands commands)
{
    public async Task<NaggerDto[]> GetAsync(Guid communityId, Guid userId,
        CancellationToken cancellationToken = default)
    {
        var nag = await queries.Nags.GetNagAsync(communityId, userId, cancellationToken);
        return nag.Select(NagMapping.ToDto).ToArray();
    }

    public async Task<NaggerDto> SaveAsync(SaveNagRequest request,
        CancellationToken cancellationToken = default)
    {
        var nag = await commands.Nags.SaveNagAsync(
            request.CommunityId,
            request.UserId,
            request.Id,
            request.Title.Trim(),
            request.ActiveLogDueOn,
            request.TargetTime,
            request.IsDeactivated,
            NagMapping.ToDomain(request.PinnedBy),
            request.UpdatedAt,
            request.ClientIdentity,
            request.ScheduleRules.Select(rule => NagMapping.ToDomain(request.Id, rule)).ToArray(),
            request.BaseVersion,
            request.NextVersion,
            cancellationToken);

        return NagMapping.ToDto(nag);
    }

    public Task<IReadOnlyList<TaskStepNameSuggestionDto>> GetTaskStepNameSuggestionsAsync(
        Guid communityId, Guid userId, Guid naggerId, CancellationToken cancellationToken = default) =>
        queries.Nags.GetTaskStepNameSuggestionsAsync(communityId, userId, naggerId, cancellationToken);
}
