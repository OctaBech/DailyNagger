using DailyNagger.Server.Operations.Demo;
using DailyNagger.Server.Operations.NagPlans;
using DailyNagger.Server.Operations.Nags;
using DailyNagger.Server.Operations.System;
using DailyNagger.Server.Operations.Tags;
using DailyNagger.Server.Operations.TaskLogs;
using DailyNagger.Server.Operations.UserMoods;

namespace DailyNagger.Server.Operations;

public sealed class OperationsFacade(
    DemoDataOperations demo,
    NagOperations nags,
    NagPlanOperations nagPlans,
    SystemOperations system,
    TagOperations tags,
    TaskLogOperations taskLogs,
    UserMoodOperations userMoods)
{
    public DemoDataOperations Demo { get; } = demo;
    public NagOperations Nags { get; } = nags;
    public NagPlanOperations NagPlans { get; } = nagPlans;
    public SystemOperations System { get; } = system;
    public TagOperations Tags { get; } = tags;
    public TaskLogOperations TaskLogs { get; } = taskLogs;
    public UserMoodOperations UserMoods { get; } = userMoods;
}
