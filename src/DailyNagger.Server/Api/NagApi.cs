using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

public static class NagApi
{
    public static IEndpointRouteBuilder MapNagApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/nags", async (
            Guid communityId,
            DataDbRead dataDbRead,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var nag = await dataDbRead.GetNagAsync(
                    communityId,
                    cancellationToken);

                return Results.Ok(nag
                    .Select(ToDto)
                    .ToArray());
            }
            catch (NagCommunityNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    error = exception.Message
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("Nags");

        app.MapPut("/api/nags/{id:guid}", async (
            Guid id,
            SaveNagRequest request,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                if (request.Id != id)
                {
                    return Results.BadRequest(new
                    {
                        error = "Route id must match request id."
                    });
                }

                validator.Validate(request);

                var nag = await dataDbWrite.SaveNagAsync(
                    request.CommunityId,
                    request.Id,
                    request.Title.Trim(),
                    request.ExpiresOn,
                    request.IsDeactivated,
                    request.NagTimes.Select(rule => ToDomain(request.Id, rule)).ToArray(),
                    request.ExpectedVersion,
                    cancellationToken);

                return Results.Ok(ToDto(nag));
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
                {
                    error = exception.Message
                });
            }
            catch (ConcurrencyConflictException exception)
            {
                return Results.Conflict(new
                {
                    error = exception.Message
                });
            }
            catch (NagCommunityNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    error = exception.Message
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("Nags");

        return app;
    }

    private static NagDto ToDto(Nag nag) =>
        new(
            nag.Id,
            nag.Title,
            nag.ScheduleUpdatedAt,
            nag.ActiveLogDueOn,
            nag.ExpiresOn,
            nag.IsDeactivated,
            nag.NagTimes.Select(ToDto).ToArray(),
            nag.Version);

    private static NagTimeDto ToDto(NagTime rule) =>
        new(
            rule.Id,
            ToDto(rule.TimeType),
            rule.DayOfWeek,
            rule.DayOfMonth,
            rule.MonthOfYear);

    private static NagTime ToDomain(Guid nagId, NagTimeDto rule) =>
        new()
        {
            Id = rule.Id,
            NagId = nagId,
            TimeType = ToDomain(rule.TimeType),
            DayOfWeek = rule.DayOfWeek,
            DayOfMonth = rule.DayOfMonth,
            MonthOfYear = rule.MonthOfYear
        };

    private static NagTimeTypeDto ToDto(NagTimeType timeType) =>
        timeType switch
        {
            NagTimeType.Weekly => NagTimeTypeDto.Weekly,
            NagTimeType.MonthlyDay => NagTimeTypeDto.MonthlyDay,
            NagTimeType.YearlyDate => NagTimeTypeDto.YearlyDate,
            _ => throw new ArgumentOutOfRangeException(nameof(timeType), timeType, null)
        };

    private static NagTimeType ToDomain(NagTimeTypeDto timeType) =>
        timeType switch
        {
            NagTimeTypeDto.Weekly => NagTimeType.Weekly,
            NagTimeTypeDto.MonthlyDay => NagTimeType.MonthlyDay,
            NagTimeTypeDto.YearlyDate => NagTimeType.YearlyDate,
            _ => throw new ArgumentOutOfRangeException(nameof(timeType), timeType, null)
        };
}
