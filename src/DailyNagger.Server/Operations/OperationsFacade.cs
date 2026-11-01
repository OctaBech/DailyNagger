using DailyNagger.Server.Operations.Tags;
using DailyNagger.Server.Operations.TaskLogs;
using DailyNagger.Server.Operations.UserMoods;

namespace DailyNagger.Server.Operations;

public sealed class OperationsFacade(
    TagOperations tags,
    TaskLogOperations taskLogs,
    UserMoodOperations userMoods)
{
    public TagOperations Tags { get; } = tags;
    public TaskLogOperations TaskLogs { get; } = taskLogs;
    public UserMoodOperations UserMoods { get; } = userMoods;
}
