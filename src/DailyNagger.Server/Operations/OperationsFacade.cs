using DailyNagger.Server.Operations.Tags;

namespace DailyNagger.Server.Operations;

public sealed class OperationsFacade(TagOperations tags)
{
    public TagOperations Tags { get; } = tags;
}
