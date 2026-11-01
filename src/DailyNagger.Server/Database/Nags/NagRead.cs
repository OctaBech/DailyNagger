using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Database.NagPlans;
using DailyNagger.Server.Database.Nags;
using DailyNagger.Server.Database.TaskLogs;
using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Nags;

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
