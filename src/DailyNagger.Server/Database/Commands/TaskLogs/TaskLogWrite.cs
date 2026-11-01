using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Validation;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Database.Commands.TaskLogs;

public sealed record TaskLogWriteResult(
    int Version,
    DateTimeOffset UpdatedAt);

public sealed class TaskLogWrite(GetDataDbConnection getDataDbConnection)
{
    public async Task<TaskLog> SaveTaskLogAsync(
        Guid communityId,
        Guid userId,
        Guid taskLogId,
        Guid nagId,
        Guid? copiedFromTaskLogId,
        DateTimeOffset? closedOn,
        string? tag,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        int descendantTaskItemCount,
        int doneDescendantTaskItemCount,
        int baseVersion,
        int nextVersion,
        IReadOnlyList<TaskItem> taskItems,
        CancellationToken cancellationToken = default)
    {
        var copiedTaskItems = taskItems
            .Select(node => new TaskItem
            {
                Id = node.Id,
                UserId = userId,
                TaskLogId = taskLogId,
                ParentTaskItemId = node.ParentTaskItemId,
                Name = node.Name,
                Tag = node.Tag,
                IsDone = node.IsDone,
                RolloverBehavior = node.RolloverBehavior,
                InteractionAt = node.InteractionAt,
                InteractionTimeZone = node.InteractionTimeZone,
                InteractionLocale = node.InteractionLocale,
                InteractionMood = node.InteractionMood,
                InteractionMoodAt = node.InteractionMoodAt,
                DescendantTaskItemCount = node.DescendantTaskItemCount,
                DoneDescendantTaskItemCount = node.DoneDescendantTaskItemCount,
                SortOrder = node.SortOrder,
                TaskEntries = node.TaskEntries
                    .Select(input => new TaskEntry
                    {
                        Id = input.Id,
                        UserId = userId,
                        TaskLogId = taskLogId,
                        ParentTaskItemId = node.Id,
                        Label = input.Label,
                        Description = input.Description,
                        ValueType = input.ValueType,
                        Tag = input.Tag,
                        Value = input.Value,
                        LastTaskRunReferenceValue = input.LastTaskRunReferenceValue,
                        RolloverBehavior = input.RolloverBehavior,
                        InteractionAt = input.InteractionAt,
                        InteractionTimeZone = input.InteractionTimeZone,
                        InteractionLocale = input.InteractionLocale,
                        InteractionMood = input.InteractionMood,
                        InteractionMoodAt = input.InteractionMoodAt,
                        SortOrder = input.SortOrder
                    })
                    .ToList()
            })
            .ToList();

        var taskLog = new TaskLog
        {
            Id = taskLogId,
            UserId = userId,
            NagId = nagId,
            CopiedFromTaskLogId = copiedFromTaskLogId,
            ClosedOn = closedOn,
            Tag = tag,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            DescendantTaskItemCount = descendantTaskItemCount,
            DoneDescendantTaskItemCount = doneDescendantTaskItemCount,
            TaskItems = copiedTaskItems
        };

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        if (!await TaskLogCommands.NagExistsAsync(connection, transaction, userId, taskLog.NagId, cancellationToken))
        {
            throw new NagValidationException("Nagger does not exist.");
        }

        if (taskLog.CopiedFromTaskLogId is { } copiedFromId
            && !await TaskLogCommands.TaskLogExistsAsync(connection, transaction, userId, copiedFromId, cancellationToken))
        {
            throw new NagValidationException("CopiedFromTaskLog does not exist.");
        }

        var currentTaskLogHeader = await TaskLogCommands.GetTaskLogHeaderAsync(
            connection,
            transaction,
            taskLog.Id,
            userId,
            cancellationToken);

        var exists = currentTaskLogHeader is not null;
        var isLateClosedTaskLogUpdate = currentTaskLogHeader?.ClosedOn is not null;

        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        if (!exists && baseVersion != 0)
        {
            throw new NagValidationException("BaseVersion must be 0 when creating a new TaskLog.");
        }

        taskLog = new TaskLog
        {
            Id = taskLog.Id,
            UserId = taskLog.UserId,
            NagId = taskLog.NagId,
            CopiedFromTaskLogId = taskLog.CopiedFromTaskLogId,
            ClosedOn = currentTaskLogHeader?.ClosedOn ?? taskLog.ClosedOn,
            Tag = taskLog.Tag,
            UpdatedAt = updatedAt,
            UpdatedByClientId = clientIdentity?.ClientId,
            UpdatedByDeviceName = clientIdentity?.DeviceName,
            UpdatedByDeviceModel = clientIdentity?.DeviceModel,
            Version = nextVersion,
            DescendantTaskItemCount = taskLog.DescendantTaskItemCount,
            DoneDescendantTaskItemCount = taskLog.DoneDescendantTaskItemCount,
            TaskItems = taskLog.TaskItems
        };

        await TaskLogCommands.UpsertTaskLogAsync(
            connection,
            transaction,
            taskLog,
            exists,
            baseVersion,
            currentTaskLogHeader?.Version,
            allowClosedUpdate: isLateClosedTaskLogUpdate,
            cancellationToken);

        await TaskLogTreeWrite.DeleteAsync(
            connection,
            transaction,
            taskLog.Id,
            userId,
            cancellationToken);

        await TaskLogTreeWrite.InsertAsync(
            connection,
            transaction,
            taskLog,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return taskLog;
    }

    public async Task<TaskLogWriteResult> UpdateTaskEntryValuesAsync(
        Guid communityId,
        Guid userId,
        Guid taskLogId,
        DateTimeOffset updatedAt,
        ClientIdentityDto? clientIdentity,
        int baseVersion,
        int nextVersion,
        IReadOnlyList<TaskEntryValueUpdateDto> taskEntries,
        CancellationToken cancellationToken = default)
    {
        if (nextVersion <= baseVersion)
        {
            throw new NagValidationException("NextVersion must be greater than BaseVersion.");
        }

        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        var taskLogIsOpen = await TaskLogCommands.TaskLogIsOpenAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            cancellationToken);

        if (!taskLogIsOpen)
        {
            var currentVersion = await TaskLogCommands.GetTaskLogVersionAsync(
                connection,
                transaction,
                userId,
                taskLogId,
                cancellationToken);

            throw new ConcurrencyConflictException(
                "TaskLog is closed and cannot accept input updates.",
                currentVersion);
        }

        var matchingInputCount = await TaskLogCommands.CountTaskEntriesInTaskLogAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            taskEntries.Select(input => input.Id).ToArray(),
            cancellationToken);

        if (matchingInputCount != taskEntries.Count)
        {
            throw new NagValidationException("All TaskEntry updates must belong to the requested TaskLog.");
        }

        await TaskLogCommands.UpdateTaskEntryValuesAsync(
            connection,
            transaction,
            userId,
            taskEntries,
            cancellationToken);

        var storedVersion = await TaskLogCommands.UpdateTaskLogVersionAsync(
            connection,
            transaction,
            userId,
            taskLogId,
            baseVersion,
            nextVersion,
            updatedAt,
            clientIdentity,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new TaskLogWriteResult(
            storedVersion,
            updatedAt);
    }
}
