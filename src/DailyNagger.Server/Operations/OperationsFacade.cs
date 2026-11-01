using DailyNagger.Server.Operations.Tags;
using DailyNagger.Server.Operations.UserMoods;

namespace DailyNagger.Server.Operations;

public sealed class OperationsFacade(TagOperations tags, UserMoodOperations userMoods)
{
    public TagOperations Tags { get; } = tags;
    public UserMoodOperations UserMoods { get; } = userMoods;
}
