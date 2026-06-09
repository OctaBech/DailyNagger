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

    private static NagPlanNagDto ToDto(NagPlanNag item) =>
        new(
            item.Nag.Id,
            item.Nag.Title,
            item.Nag.ScheduleUpdatedAt,
            item.Nag.ActiveLogDueOn,
            item.Nag.ExpiresOn,
            item.Nag.IsDeactivated,
            item.Nag.NagTimes
                .Select(ToDto)
                .ToArray(),
            ToDto(item.NagLog),
            item.Nag.Version);

    private static NagLogDto ToDto(NagLog nagLog) =>
        new(
            nagLog.Id,
            nagLog.NagId,
            nagLog.CopiedFromNagLogId,
            nagLog.ClosedOn,
            nagLog.UpdatedAt,
            nagLog.Version,
            nagLog.NagNodes
                .Where(node => node.ParentNagNodeId is null)
                .OrderBy(node => node.SortOrder)
                .Select(node => ToDto(node, nagLog.NagNodes))
                .ToArray());

    private static NagNodeDto ToDto(
        NagNode node,
        IReadOnlyList<NagNode> allNodes) =>
        new(
            node.Id,
            node.NagLogId,
            node.ParentNagNodeId,
            node.Name,
            node.SortOrder,
            node.NagInputs
                .OrderBy(input => input.SortOrder)
                .Select(ToDto)
                .ToArray(),
            allNodes
                .Where(child => child.ParentNagNodeId == node.Id)
                .OrderBy(child => child.SortOrder)
                .Select(child => ToDto(child, allNodes))
                .ToArray());

    private static NagInputDto ToDto(NagInput input) =>
        new(
            input.Id,
            input.NagLogId,
            input.ParentNagNodeId,
            input.Label,
            input.Description,
            ToDto(input.ValueType),
            input.Unit,
            input.Value,
            input.SortOrder,
            input.PreviousValue);

    private static NagTimeDto ToDto(NagTime rule) =>
        new(
            rule.Id,
            ToDto(rule.TimeType),
            rule.DayOfWeek,
            rule.DayOfMonth,
            rule.MonthOfYear);

    private static NagTimeTypeDto ToDto(NagTimeType timeType) =>
        timeType switch
        {
            NagTimeType.Weekly => NagTimeTypeDto.Weekly,
            NagTimeType.MonthlyDay => NagTimeTypeDto.MonthlyDay,
            NagTimeType.YearlyDate => NagTimeTypeDto.YearlyDate,
            _ => throw new ArgumentOutOfRangeException(nameof(timeType), timeType, null)
        };

    private static NagInputValueTypeDto ToDto(NagInputValueType valueType) =>
        valueType switch
        {
            NagInputValueType.Text => NagInputValueTypeDto.Text,
            NagInputValueType.Integer => NagInputValueTypeDto.Integer,
            NagInputValueType.Decimal => NagInputValueTypeDto.Decimal,
            NagInputValueType.Boolean => NagInputValueTypeDto.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };
}
