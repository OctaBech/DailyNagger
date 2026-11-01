using DailyNagger.Server.Database.Queries.Control;
using DailyNagger.Server.Database.Queries.NagPlans;
using DailyNagger.Server.Database.Queries.Nags;
using DailyNagger.Server.Database.Queries.System;
using DailyNagger.Server.Database.Queries.Tags;
using DailyNagger.Server.Database.Queries.UserMoods;

namespace DailyNagger.Server.Database;

// Groups database reads for discoverability through IntelliSense.
// Intentionally trades narrower dependencies for a single entry point.
public sealed class DatabaseQueries(
    ControlDbRead control,
    NagRead nags,
    NagPlanRead nagPlans,
    DatabaseHealthRead system,
    TagRead tags,
    UserMoodRead userMoods)
{
    public ControlDbRead Control { get; } = control;
    public NagRead Nags { get; } = nags;
    public NagPlanRead NagPlans { get; } = nagPlans;
    public DatabaseHealthRead System { get; } = system;
    public TagRead Tags { get; } = tags;
    public UserMoodRead UserMoods { get; } = userMoods;
}
