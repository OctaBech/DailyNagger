using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Validation.TaskLogs;

internal static class TaskLogTreeValidation
{
    public static void ValidateTaskItem(
        Guid taskLogId,
        Guid? expectedParentTaskItemId,
        TaskItemDto node,
        HashSet<Guid> nodeIds,
        HashSet<Guid> inputIds)
    {
        if (node.Id == Guid.Empty)
        {
            throw new NagValidationException("TaskItem Id is required.");
        }

        if (node.TaskLogId != taskLogId)
        {
            throw new NagValidationException("TaskItem TaskLogId must match the requested TaskLog.");
        }

        if (node.ParentTaskItemId != expectedParentTaskItemId)
        {
            throw new NagValidationException("TaskItem ParentTaskItemId must match its nested position.");
        }

        if (!nodeIds.Add(node.Id))
        {
            throw new NagValidationException("TaskItem Id values must be unique.");
        }

        foreach (var input in node.TaskEntries)
        {
            ValidateTaskEntry(taskLogId, node.Id, input, inputIds);
        }

        foreach (var child in node.TaskItems)
        {
            ValidateTaskItem(taskLogId, node.Id, child, nodeIds, inputIds);
        }
    }

    private static void ValidateTaskEntry(
        Guid taskLogId,
        Guid expectedParentTaskItemId,
        TaskEntryDto input,
        HashSet<Guid> inputIds)
    {
        if (input.Id == Guid.Empty)
        {
            throw new NagValidationException("TaskEntry Id is required.");
        }

        if (input.TaskLogId != taskLogId)
        {
            throw new NagValidationException("TaskEntry TaskLogId must match the requested TaskLog.");
        }

        if (input.ParentTaskItemId != expectedParentTaskItemId)
        {
            throw new NagValidationException("TaskEntry ParentTaskItemId must match its parent TaskItem.");
        }

        if (!inputIds.Add(input.Id))
        {
            throw new NagValidationException("TaskEntry Id values must be unique.");
        }

    }
}
