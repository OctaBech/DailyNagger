using DailyNagger.Server.Contracts.NagPlans;
using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Operations;

namespace DailyNagger.Server.Api.NagPlans;

public static class NagPlanApi
{
    public static IEndpointRouteBuilder MapNagPlanApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/todays-nag-plan", GetNagPlan)
            .WithTags("NagPlan")
            .Produces<NagPlanDto>(StatusCodes.Status200OK);

        app.MapGet("/api/nag-plan", GetNagPlan)
            .WithTags("NagPlan")
            .Produces<NagPlanDto>(StatusCodes.Status200OK);

        return app;
    }

    private static async Task<IResult> GetNagPlan(
        Guid communityId,
        Guid userId,
        DateOnly date,
        OperationsFacade operations,
        IHostEnvironment environment,
        CancellationToken cancellationToken)
    {
        try
        {
            var plan = await operations.NagPlans.GetAsync(
                communityId,
                userId,
                date,
                cancellationToken);

            return Results.Ok(plan);
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
    }
}
