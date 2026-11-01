using DailyNagger.Server.Domain.Exceptions;

namespace DailyNagger.Server.Api;

internal static class ApiErrorResults
{
    public static IResult BadRequest(string message) =>
        Results.BadRequest(new { error = message });

    public static IResult NotFound(string message) =>
        Results.NotFound(new { error = message });

    public static IResult Conflict(WriteConflictException exception) =>
        Results.Conflict(new
        {
            error = exception.Message,
            currentVersion = exception.CurrentVersion
        });

    public static IResult Problem(Exception exception, IHostEnvironment environment) =>
        Results.Problem(
            environment.IsDevelopment() ? exception.ToString() : exception.Message);
}
