using DailyNagger.Server.Domain;
using Microsoft.Data.SqlClient;

namespace DailyNagger.Server.Operations;

public sealed class DataDbRead(GetDataDbConnection getDataDbConnection)
{
    public async Task<IReadOnlyList<TaskSeries>> GetTaskSeriesAsync(
        Guid communityId,
        CancellationToken cancellationToken = default)
    {
        await using var connection = await getDataDbConnection.OpenAsync(
            communityId,
            cancellationToken);

        await using var command = new SqlCommand(
            "select Id from task_series order by Id",
            connection);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var taskSeries = new List<TaskSeries>();

        while (await reader.ReadAsync(cancellationToken))
        {
            taskSeries.Add(new TaskSeries
            {
                Id = reader.GetGuid(0)
            });
        }

        return taskSeries;
    }
}
