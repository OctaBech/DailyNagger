using DailyNagger.Server.Database.Commands.Demo;
using DailyNagger.Server.Database.Commands.Nags;
using DailyNagger.Server.Database.Commands.Tags;
using DailyNagger.Server.Database.Commands.TaskLogs;
using DailyNagger.Server.Database.Commands.UserMoods;

namespace DailyNagger.Server.Database;

public sealed class DatabaseCommands(
    DemoDataWrite demo,
    NagWrite nags,
    TagWrite tags,
    TaskLogWrite taskLogs,
    UserMoodWrite userMoods)
{
    public DemoDataWrite Demo { get; } = demo;
    public NagWrite Nags { get; } = nags;
    public TagWrite Tags { get; } = tags;
    public TaskLogWrite TaskLogs { get; } = taskLogs;
    public UserMoodWrite UserMoods { get; } = userMoods;
}
