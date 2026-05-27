namespace DailyNagger.Api.Contracts;

public enum TaskStatusDto
{
    Active,
    Completed
}

public sealed record TaskSummaryDto(
    Guid Id,
    string Title,
    TaskStatusDto Status,
    DateTimeOffset CreatedAt);

public sealed record CreateTaskRequest(
    string Title);
