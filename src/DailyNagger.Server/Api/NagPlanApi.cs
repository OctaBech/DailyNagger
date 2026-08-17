using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api;

public static class NagPlanApi
{
    public static IEndpointRouteBuilder MapNagPlanApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/todays-nag-plan", GetNagPlan)
            .WithTags("NagPlan");

        app.MapGet("/api/nag-plan", GetNagPlan)
            .WithTags("NagPlan");

        return app;
    }

    private static async Task<IResult> GetNagPlan(
        Guid communityId,
        Guid userId,
        DateOnly date,
        DataDbRead dataDbRead,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        try
        {
            var plan = await dataDbRead.GetNagPlanAsync(
                communityId,
                userId,
                date,
                cancellationToken);

            return Results.Ok(ToDto(plan));
        }
        catch (NagCommunityNotFoundException exception)
        {
            return Results.NotFound(new
            {
                error = exception.Message
            });
        }
        catch (Exception exception)
        {
            return Results.Problem(
                environment.IsDevelopment() ? exception.ToString() : exception.Message);
        }
    }

    private static NagPlanDto ToDto(NagPlan plan) =>
        new(
            plan.Date,
            plan.Nags
                .Select(ToDto)
                .ToArray());

    private static NagPlanNaggerDto ToDto(NagPlanNagger item) =>
        new(
            item.Nagger.Id,
            item.Nagger.Title,
            item.Nagger.ActiveLogDueOn,
            item.Nagger.ExpiresOn,
            item.Nagger.TargetTime,
            item.Nagger.IsDeactivated,
            ToDto(item.Nagger.PinnedBy),
            item.Nagger.UpdatedAt,
            item.Nagger.UpdatedByClientId,
            item.Nagger.UpdatedByDeviceName,
            item.Nagger.UpdatedByDeviceModel,
            item.Nagger.ScheduleRules
                .Select(ToDto)
                .ToArray(),
            ToDto(item.TaskLog),
            item.Nagger.Version);

    private static NaggerPinnedByDto ToDto(NaggerPinnedBy pinnedBy) =>
        pinnedBy switch
        {
            NaggerPinnedBy.None => NaggerPinnedByDto.None,
            NaggerPinnedBy.User => NaggerPinnedByDto.User,
            NaggerPinnedBy.Llm => NaggerPinnedByDto.Llm,
            NaggerPinnedBy.Community => NaggerPinnedByDto.Community,
            _ => throw new ArgumentOutOfRangeException(nameof(pinnedBy), pinnedBy, null)
        };

    private static TaskLogDto ToDto(TaskLog taskLog) =>
        new(
            taskLog.Id,
            taskLog.NagId,
            taskLog.CopiedFromTaskLogId,
            taskLog.ClosedOn,
            taskLog.Tag,
            taskLog.UpdatedAt,
            taskLog.UpdatedByClientId,
            taskLog.UpdatedByDeviceName,
            taskLog.UpdatedByDeviceModel,
            taskLog.Version,
            taskLog.TaskItems
                .Where(node => node.ParentTaskItemId is null)
                .OrderBy(node => node.SortOrder)
                .Select(node => ToDto(node, taskLog.TaskItems))
                .ToArray(),
            taskLog.DescendantTaskItemCount,
            taskLog.DoneDescendantTaskItemCount);

    private static TaskItemDto ToDto(
        TaskItem node,
        IReadOnlyList<TaskItem> allNodes) =>
        new(
            node.Id,
            node.TaskLogId,
            node.ParentTaskItemId,
            node.Name,
            node.Tag,
            node.TaskEntries
                .OrderBy(input => input.SortOrder)
                .Select(ToDto)
                .ToArray(),
            allNodes
                .Where(child => child.ParentTaskItemId == node.Id)
                .OrderBy(child => child.SortOrder)
                .Select(child => ToDto(child, allNodes))
                .ToArray(),
            node.IsDone,
            ToDto(node.RolloverBehavior),
            node.InteractionAt,
            node.InteractionTimeZone,
            node.InteractionLocale,
            node.InteractionMood,
            node.InteractionMoodAt,
            node.DescendantTaskItemCount,
            node.DoneDescendantTaskItemCount);

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
            ToDto(input.RolloverBehavior),
            input.InteractionAt,
            input.InteractionTimeZone,
            input.InteractionLocale,
            input.InteractionMood,
            input.InteractionMoodAt);

    private static ScheduleRuleDto ToDto(ScheduleRule rule) =>
        new(
            rule.Id,
            ToDto(rule.RuleType),
            rule.RuleJson);

    private static ScheduleRuleTypeDto ToDto(ScheduleRuleType ruleType) =>
        ruleType switch
        {
            ScheduleRuleType.Weekday => ScheduleRuleTypeDto.Weekday,
            ScheduleRuleType.Date => ScheduleRuleTypeDto.Date,
            ScheduleRuleType.Holiday => ScheduleRuleTypeDto.Holiday,
            _ => throw new ArgumentOutOfRangeException(nameof(ruleType), ruleType, null)
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

    private static RolloverBehaviorDto ToDto(RolloverBehavior rolloverBehavior) =>
        rolloverBehavior switch
        {
            RolloverBehavior.Keep => RolloverBehaviorDto.Keep,
            RolloverBehavior.Remove => RolloverBehaviorDto.Remove,
            RolloverBehavior.RemoveWhenDone => RolloverBehaviorDto.RemoveWhenDone,
            RolloverBehavior.MoveValueToHistory => RolloverBehaviorDto.MoveValueToHistory,
            RolloverBehavior.CarryOverValue => RolloverBehaviorDto.CarryOverValue,
            _ => throw new ArgumentOutOfRangeException(nameof(rolloverBehavior), rolloverBehavior, null)
        };
}
