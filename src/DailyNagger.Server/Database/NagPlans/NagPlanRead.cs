using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Database.NagPlans;
using DailyNagger.Server.Database.Nags;
using DailyNagger.Server.Database.TaskLogs;
using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.NagPlans;

public sealed class NagPlanRead(GetDataDbConnection getDataDbConnection)
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
