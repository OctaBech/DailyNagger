using DailyNagger.Api.Contracts;

namespace DailyNagger.Api.Tests;

public sealed class TaskContractTests
{
    [Fact]
    public void CreateTaskRequest_keeps_title_value()
    {
        var request = new CreateTaskRequest("Gym");

        Assert.Equal("Gym", request.Title);
    }

    [Fact]
    public void TaskSummaryDto_can_represent_active_task()
    {
        var id = Guid.NewGuid();
        var createdAt = DateTimeOffset.UtcNow;

        var task = new TaskSummaryDto(id, "Gym", TaskStatusDto.Active, createdAt);

        Assert.Equal(id, task.Id);
        Assert.Equal("Gym", task.Title);
        Assert.Equal(TaskStatusDto.Active, task.Status);
        Assert.Equal(createdAt, task.CreatedAt);
    }
}
