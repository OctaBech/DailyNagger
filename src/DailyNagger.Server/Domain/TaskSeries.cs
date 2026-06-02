namespace DailyNagger.Server.Domain;

public sealed class TaskSeries
{
    public Guid Id { get; init; } = Guid.NewGuid();
}
