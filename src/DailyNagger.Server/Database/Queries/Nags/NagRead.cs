using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Domain.Tenant;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Queries.Nags;

public sealed class NagRead(GetDataDbConnection getDataDbConnection)
{
    public async Task<IReadOnlyList<TaskStepNameSuggestionDto>> GetTaskStepNameSuggestionsAsync(
        Guid communityId,
        Guid userId,
        Guid naggerId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        return await NagQueries.GetTaskStepNameSuggestionsAsync(
            connection,
            userId,
            naggerId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Nagger>> GetNagAsync(
        Guid communityId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        var nag = await NagQueries.GetNagsAsync(
            connection,
            userId,
            cancellationToken);

        foreach (var item in nag)
        {
            item.ScheduleRules.AddRange(await NagQueries.GetScheduleRulesAsync(
                connection,
                userId,
                item.Id,
                cancellationToken));
        }

        return nag;
    }
}
