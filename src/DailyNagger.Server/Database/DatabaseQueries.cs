using DailyNagger.Server.Database.Control;
using DailyNagger.Server.Database.NagPlans;
using DailyNagger.Server.Database.Nags;
using DailyNagger.Server.Database.Tags;
using DailyNagger.Server.Database.UserMoods;

namespace DailyNagger.Server.Database;

public sealed class DatabaseQueries(
    ControlDbRead control,
    NagRead nags,
    NagPlanRead nagPlans,
    TagRead tags,
    UserMoodRead userMoods)
{
    public ControlDbRead Control { get; } = control;
    public NagRead Nags { get; } = nags;
    public NagPlanRead NagPlans { get; } = nagPlans;
    public TagRead Tags { get; } = tags;
    public UserMoodRead UserMoods { get; } = userMoods;
}
