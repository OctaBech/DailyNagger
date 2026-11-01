using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Database;
using DailyNagger.Server.Mapping;

namespace DailyNagger.Server.Operations.TaskLogs;

public sealed class TaskLogOperations(DatabaseCommands commands)
{
    public async Task<TaskLogDto> SaveAsync(
        SaveTaskLogRequest request,
        CancellationToken cancellationToken = default)
    {
        var taskLog = await commands.TaskLogs.SaveTaskLogAsync(
            request.CommunityId,
            request.UserId,
            request.Id,
            request.NagId,
            request.CopiedFromTaskLogId,
            request.ClosedOn,
            request.Tag,
            request.UpdatedAt,
            request.ClientIdentity,
            request.DescendantTaskItemCount,
            request.DoneDescendantTaskItemCount,
            request.BaseVersion,
            request.NextVersion,
            request.TaskItems
                .SelectMany((node, sortOrder) => TaskLogMapping.ToDomainTree(request.Id, null, sortOrder, node))
                .ToArray(),
            cancellationToken);

        return TaskLogMapping.ToDto(taskLog);
    }

    public async Task<TaskLogVersionDto> UpdateEntryValuesAsync(
        Guid id,
        UpdateTaskEntryValuesRequest request,
        CancellationToken cancellationToken = default)
    {
        var result = await commands.TaskLogs.UpdateTaskEntryValuesAsync(
            request.CommunityId,
            request.UserId,
            id,
            request.UpdatedAt,
            request.ClientIdentity,
            request.BaseVersion,
            request.NextVersion,
            request.Payload,
            cancellationToken);

        return new TaskLogVersionDto(
            result.Version,
            result.UpdatedAt);
    }
}
