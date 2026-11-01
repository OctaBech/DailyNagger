using DailyNagger.Server.Contracts.TaskLogs;
using DailyNagger.Server.Domain.Tenant;

namespace DailyNagger.Server.Mapping;

internal static class TaskLogMapping
{
    public static TaskLogDto ToDto(TaskLog taskLog) =>
        new(
            Id: taskLog.Id,
            NagId: taskLog.NagId,
            CopiedFromTaskLogId: taskLog.CopiedFromTaskLogId,
            ClosedOn: taskLog.ClosedOn,
            UpdatedAt: taskLog.UpdatedAt,
            UpdatedByClientId: taskLog.UpdatedByClientId,
            UpdatedByDeviceName: taskLog.UpdatedByDeviceName,
            UpdatedByDeviceModel: taskLog.UpdatedByDeviceModel,
            Version: taskLog.Version,
            TaskItems: taskLog.TaskItems
                .Where(node => node.ParentTaskItemId is null)
                .OrderBy(node => node.SortOrder)
                .Select(node => ToDto(node, taskLog.TaskItems))
                .ToArray(),
            Tag: taskLog.Tag,
            DescendantTaskItemCount: taskLog.DescendantTaskItemCount,
            DoneDescendantTaskItemCount: taskLog.DoneDescendantTaskItemCount);

    private static TaskItemDto ToDto(
        TaskItem node,
        IReadOnlyList<TaskItem> allNodes) =>
        new(
            Id: node.Id,
            TaskLogId: node.TaskLogId,
            ParentTaskItemId: node.ParentTaskItemId,
            Name: node.Name,
            TaskEntries: node.TaskEntries
                .OrderBy(input => input.SortOrder)
                .Select(ToDto)
                .ToArray(),
            TaskItems: allNodes
                .Where(child => child.ParentTaskItemId == node.Id)
                .OrderBy(child => child.SortOrder)
                .Select(child => ToDto(child, allNodes))
                .ToArray(),
            Tag: node.Tag,
            IsDone: node.IsDone,
            RolloverBehavior: ToTaskItemRolloverBehaviorDto(node.RolloverBehavior),
            InteractionAt: node.InteractionAt,
            InteractionTimeZone: node.InteractionTimeZone,
            InteractionLocale: node.InteractionLocale,
            InteractionMood: node.InteractionMood,
            InteractionMoodAt: node.InteractionMoodAt,
            DescendantTaskItemCount: node.DescendantTaskItemCount,
            DoneDescendantTaskItemCount: node.DoneDescendantTaskItemCount);

    private static TaskEntryDto ToDto(TaskEntry input) =>
        new(
            input.Id,
            input.TaskLogId,
            input.ParentTaskItemId,
            input.Label,
            input.Description,
            ToDto(input.ValueType),
            input.Tag,
            input.Value,
            input.LastTaskRunReferenceValue,
            ToTaskEntryRolloverBehaviorDto(input.RolloverBehavior),
            input.InteractionAt,
            input.InteractionTimeZone,
            input.InteractionLocale,
            input.InteractionMood,
            input.InteractionMoodAt);

    public static IEnumerable<TaskItem> ToDomainTree(
        Guid taskLogId,
        Guid? parentTaskItemId,
        int sortOrder,
        TaskItemDto node)
    {
        yield return new TaskItem
        {
            Id = node.Id,
            TaskLogId = taskLogId,
            ParentTaskItemId = parentTaskItemId,
            Name = node.Name.Trim(),
            Tag = string.IsNullOrWhiteSpace(node.Tag)
                ? null
                : node.Tag.Trim(),
            IsDone = node.IsDone,
            RolloverBehavior = ToDomain(node.RolloverBehavior),
            InteractionAt = node.InteractionAt,
            InteractionTimeZone = string.IsNullOrWhiteSpace(node.InteractionTimeZone)
                ? null
                : node.InteractionTimeZone.Trim(),
            InteractionLocale = string.IsNullOrWhiteSpace(node.InteractionLocale)
                ? null
                : node.InteractionLocale.Trim(),
            InteractionMood = string.IsNullOrWhiteSpace(node.InteractionMood)
                ? null
                : node.InteractionMood.Trim(),
            InteractionMoodAt = node.InteractionMoodAt,
            DescendantTaskItemCount = node.DescendantTaskItemCount,
            DoneDescendantTaskItemCount = node.DoneDescendantTaskItemCount,
            SortOrder = sortOrder,
            TaskEntries = node.TaskEntries
                .Select((input, inputSortOrder) => ToDomain(taskLogId, node.Id, inputSortOrder, input))
                .ToList()
        };

        foreach (var child in node.TaskItems.SelectMany((child, childSortOrder) =>
            ToDomainTree(taskLogId, node.Id, childSortOrder, child)))
        {
            yield return child;
        }
    }

    private static TaskEntry ToDomain(
        Guid taskLogId,
        Guid parentTaskItemId,
        int sortOrder,
        TaskEntryDto input) =>
        new()
        {
            Id = input.Id,
            TaskLogId = taskLogId,
            ParentTaskItemId = parentTaskItemId,
            Label = input.Label?.Trim() ?? "",
            Description = string.IsNullOrWhiteSpace(input.Description)
                ? null
                : input.Description.Trim(),
            ValueType = ToDomain(input.ValueType),
            Tag = string.IsNullOrWhiteSpace(input.Tag)
                ? null
                : input.Tag.Trim(),
            Value = input.Value,
            LastTaskRunReferenceValue = input.LastTaskRunReferenceValue,
            RolloverBehavior = ToDomain(input.RolloverBehavior),
            InteractionAt = input.InteractionAt,
            InteractionTimeZone = string.IsNullOrWhiteSpace(input.InteractionTimeZone)
                ? null
                : input.InteractionTimeZone.Trim(),
            InteractionLocale = string.IsNullOrWhiteSpace(input.InteractionLocale)
                ? null
                : input.InteractionLocale.Trim(),
            InteractionMood = string.IsNullOrWhiteSpace(input.InteractionMood)
                ? null
                : input.InteractionMood.Trim(),
            InteractionMoodAt = input.InteractionMoodAt,
            SortOrder = sortOrder
        };

    private static TaskEntryValueTypeDto ToDto(TaskEntryValueType valueType) =>
        valueType switch
        {
            TaskEntryValueType.Text => TaskEntryValueTypeDto.Text,
            TaskEntryValueType.Integer => TaskEntryValueTypeDto.Integer,
            TaskEntryValueType.Decimal => TaskEntryValueTypeDto.Decimal,
            TaskEntryValueType.Boolean => TaskEntryValueTypeDto.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };

    private static TaskItemRolloverBehaviorDto ToTaskItemRolloverBehaviorDto(RolloverBehavior rolloverBehavior) =>
        rolloverBehavior switch
        {
            RolloverBehavior.Keep => TaskItemRolloverBehaviorDto.Keep,
            RolloverBehavior.RemoveWhenDone => TaskItemRolloverBehaviorDto.RemoveWhenDone,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static TaskEntryRolloverBehaviorDto ToTaskEntryRolloverBehaviorDto(RolloverBehavior rolloverBehavior) =>
        rolloverBehavior switch
        {
            RolloverBehavior.Remove => TaskEntryRolloverBehaviorDto.Remove,
            RolloverBehavior.MoveValueToHistory => TaskEntryRolloverBehaviorDto.MoveValueToHistory,
            RolloverBehavior.CarryOverValue => TaskEntryRolloverBehaviorDto.CarryOverValue,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static RolloverBehavior ToDomain(TaskItemRolloverBehaviorDto rolloverBehavior) =>
        rolloverBehavior switch
        {
            TaskItemRolloverBehaviorDto.Keep => RolloverBehavior.Keep,
            TaskItemRolloverBehaviorDto.RemoveWhenDone => RolloverBehavior.RemoveWhenDone,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static RolloverBehavior ToDomain(TaskEntryRolloverBehaviorDto rolloverBehavior) =>
        rolloverBehavior switch
        {
            TaskEntryRolloverBehaviorDto.Remove => RolloverBehavior.Remove,
            TaskEntryRolloverBehaviorDto.MoveValueToHistory => RolloverBehavior.MoveValueToHistory,
            TaskEntryRolloverBehaviorDto.CarryOverValue => RolloverBehavior.CarryOverValue,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };

    private static TaskEntryValueType ToDomain(TaskEntryValueTypeDto valueType) =>
        valueType switch
        {
            TaskEntryValueTypeDto.Text => TaskEntryValueType.Text,
            TaskEntryValueTypeDto.Integer => TaskEntryValueType.Integer,
            TaskEntryValueTypeDto.Decimal => TaskEntryValueType.Decimal,
            TaskEntryValueTypeDto.Boolean => TaskEntryValueType.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };
}
