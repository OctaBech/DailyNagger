using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Mapping;

internal static class NagPlanMapping
{
    public static NagPlanDto ToDto(NagPlan plan) =>
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
            item.Nagger.TargetTime,
            item.Nagger.IsDeactivated,
            NagMapping.ToDto(item.Nagger.PinnedBy),
            item.Nagger.UpdatedAt,
            item.Nagger.UpdatedByClientId,
            item.Nagger.UpdatedByDeviceName,
            item.Nagger.UpdatedByDeviceModel,
            item.Nagger.ScheduleRules
                .Select(NagMapping.ToDto)
                .ToArray(),
            TaskLogMapping.ToDto(item.TaskLog),
            item.Nagger.Version);
}
