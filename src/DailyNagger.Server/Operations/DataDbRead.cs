using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations.NagPlans;
using DailyNagger.Server.Operations.Nags;
using DailyNagger.Server.Operations.TaskLogs;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed class DataDbRead(GetDataDbConnection getDataDbConnection)
{
    public async Task<NagPlan> GetNagPlanAsync(
        Guid communityId,
        Guid userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        var plan = new NagPlan
        {
            Date = date
        };

        plan.Nags.AddRange(await NagPlanQueries.GetNagsAsync(
            connection,
            userId,
            cancellationToken));

        foreach (var item in plan.Nags)
        {
            item.Nagger.ScheduleRules.AddRange(await NagQueries.GetScheduleRulesAsync(
                connection,
                userId,
                item.Nagger.Id,
                cancellationToken));

            item.TaskLog.TaskItems.AddRange(await GetTaskItemsAsync(
                connection,
                userId,
                item.TaskLog.Id,
                cancellationToken));
        }

        return plan;
    }

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

    private static async Task<IReadOnlyList<TaskItem>> GetTaskItemsAsync(
        SqlConnection connection,
        Guid userId,
        Guid taskLogId,
        CancellationToken cancellationToken)
    {
        var nodes = await TaskLogQueries.GetTaskItemsAsync(
            connection,
            userId,
            taskLogId,
            cancellationToken);

        foreach (var node in nodes)
        {
            node.TaskEntries.AddRange(await TaskLogQueries.GetTaskEntriesAsync(
                connection,
                userId,
                taskLogId,
                node.Id,
                cancellationToken));
        }

        return nodes;
    }
}
