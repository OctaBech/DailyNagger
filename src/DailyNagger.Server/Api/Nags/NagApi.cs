using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Contracts.Nags;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Domain.Exceptions;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api.Nags;

public static class NagApi
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public static IEndpointRouteBuilder MapNagApi(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/nags", async (
            Guid communityId,
            Guid userId,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var nag = await operations.Nags.GetAsync(
                    communityId,
                    userId,
                    cancellationToken);

                return Results.Ok(nag);
            }
            catch (NagCommunityNotFoundException exception)
            {
                return ApiErrorResults.NotFound(exception.Message);
            }
            catch (Exception exception)
            {
                return ApiErrorResults.Problem(exception, environment);
            }
        })
            .WithTags("Nags")
            .Produces<NaggerDto[]>(StatusCodes.Status200OK);

        app.MapPut("/api/nags/{id:guid}", async (
            Guid id,
            JsonElement requestJson,
            RequestValidator validator,
            OperationsFacade operations,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var request = ToSaveNagRequest(requestJson);

                if (request.Id != id)
                {
                    return ApiErrorResults.BadRequest("Route id must match request id.");
                }

                validator.Validate(request);

                var nag = await operations.Nags.SaveAsync(request, cancellationToken);

                return Results.Ok(nag);
            }
            catch (NagValidationException exception)
            {
                return ApiErrorResults.BadRequest(exception.Message);
            }
            catch (JsonException exception)
            {
                return ApiErrorResults.BadRequest(exception.Message);
            }
            catch (WriteConflictException exception)
            {
                return ApiErrorResults.Conflict(exception);
            }
            catch (NagCommunityNotFoundException exception)
            {
                return ApiErrorResults.NotFound(exception.Message);
            }
            catch (Exception exception)
            {
                return ApiErrorResults.Problem(exception, environment);
            }
        })
            .WithTags("Nags")
            .Accepts<VersionedRequest<NaggerDto>>("application/json")
            .Produces<NaggerDto>(StatusCodes.Status200OK);

        return app;
    }

    private static SaveNagRequest ToSaveNagRequest(JsonElement requestJson)
    {
        if (!requestJson.TryGetProperty("payload", out _))
        {
            return requestJson.Deserialize<SaveNagRequest>(JsonOptions)
                ?? throw new JsonException("Nag request body is required.");
        }

        var versionedRequest = requestJson.Deserialize<VersionedRequest<NaggerDto>>(
            JsonOptions)
            ?? throw new JsonException("Nag request body is required.");

        if (versionedRequest.Payload is null)
        {
            throw new JsonException("Nag request payload is required.");
        }

        if (!versionedRequest.SkipPayloadVersionValidation)
        {
            RequestValidator.ValidatePayloadVersion(
                versionedRequest.Payload.Version,
                versionedRequest.BaseVersion,
                versionedRequest.NextVersion);
        }

        return new SaveNagRequest(
            versionedRequest.CommunityId,
            versionedRequest.UserId,
            versionedRequest.Payload.Id,
            versionedRequest.Payload.Title,
            versionedRequest.Payload.ActiveLogDueOn,
            versionedRequest.Payload.TargetTime,
            versionedRequest.Payload.IsDeactivated,
            versionedRequest.Payload.PinnedBy,
            versionedRequest.Payload.ScheduleRules,
            versionedRequest.Payload.UpdatedAt,
            versionedRequest.BaseVersion,
            versionedRequest.NextVersion,
            versionedRequest.ClientIdentity);
    }
}
