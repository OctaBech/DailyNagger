using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

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
        })
            .WithTags("Nags")
            .Produces<NaggerDto[]>(StatusCodes.Status200OK);

        app.MapPut("/api/nags/{id:guid}", async (
            Guid id,
            JsonElement requestJson,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var request = ToSaveNagRequest(requestJson);

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
                    request.ActiveLogDueOn,
                    request.ExpiresOn,
                    request.TargetTime,
                    request.IsDeactivated,
                    ToDomain(request.PinnedBy),
                    request.UpdatedAt,
                    request.ClientIdentity,
                    request.ScheduleRules.Select(rule => ToDomain(request.Id, rule)).ToArray(),
                    request.BaseVersion,
                    request.NextVersion,
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
            catch (JsonException exception)
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
                    error = exception.Message,
                    currentVersion = exception.CurrentVersion
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
            NagRequestValidator.ValidatePayloadVersion(
                versionedRequest.Payload.Version,
                versionedRequest.BaseVersion,
                versionedRequest.NextVersion);
        }

        return new SaveNagRequest(
            versionedRequest.CommunityId,
            versionedRequest.Payload.Id,
            versionedRequest.Payload.Title,
            versionedRequest.Payload.ActiveLogDueOn,
            versionedRequest.Payload.ExpiresOn,
            versionedRequest.Payload.TargetTime,
            versionedRequest.Payload.IsDeactivated,
            versionedRequest.Payload.PinnedBy,
            versionedRequest.Payload.ScheduleRules,
            versionedRequest.Payload.UpdatedAt,
            versionedRequest.BaseVersion,
            versionedRequest.NextVersion,
            versionedRequest.ClientIdentity);
    }

    private static NaggerDto ToDto(Nagger nag) =>
        new(
            nag.Id,
            nag.Title,
            nag.ActiveLogDueOn,
            nag.ExpiresOn,
            nag.TargetTime,
            nag.IsDeactivated,
            ToDto(nag.PinnedBy),
            nag.UpdatedAt,
            nag.UpdatedByClientId,
            nag.UpdatedByDeviceName,
            nag.UpdatedByDeviceModel,
            nag.ScheduleRules.Select(ToDto).ToArray(),
            nag.Version);

    private static NaggerPinnedByDto ToDto(NaggerPinnedBy pinnedBy) =>
        pinnedBy switch
        {
            NaggerPinnedBy.None => NaggerPinnedByDto.None,
            NaggerPinnedBy.User => NaggerPinnedByDto.User,
            NaggerPinnedBy.Llm => NaggerPinnedByDto.Llm,
            NaggerPinnedBy.Community => NaggerPinnedByDto.Community,
            _ => throw new ArgumentOutOfRangeException(nameof(pinnedBy), pinnedBy, null)
        };

    private static NaggerPinnedBy ToDomain(NaggerPinnedByDto pinnedBy) =>
        pinnedBy switch
        {
            NaggerPinnedByDto.None => NaggerPinnedBy.None,
            NaggerPinnedByDto.User => NaggerPinnedBy.User,
            NaggerPinnedByDto.Llm => NaggerPinnedBy.Llm,
            NaggerPinnedByDto.Community => NaggerPinnedBy.Community,
            _ => throw new ArgumentOutOfRangeException(nameof(pinnedBy), pinnedBy, null)
        };

    private static ScheduleRuleDto ToDto(ScheduleRule rule) =>
        new(
            rule.Id,
            ToDto(rule.RuleType),
            rule.RuleJson);

    private static ScheduleRule ToDomain(Guid nagId, ScheduleRuleDto rule) =>
        new()
        {
            Id = rule.Id,
            NagId = nagId,
            RuleType = ToDomain(rule.RuleType),
            RuleJson = rule.RuleJson
        };

    private static ScheduleRuleTypeDto ToDto(ScheduleRuleType ruleType) =>
        ruleType switch
        {
            ScheduleRuleType.Weekday => ScheduleRuleTypeDto.Weekday,
            ScheduleRuleType.Date => ScheduleRuleTypeDto.Date,
            ScheduleRuleType.Holiday => ScheduleRuleTypeDto.Holiday,
            _ => throw new ArgumentOutOfRangeException(nameof(ruleType), ruleType, null)
        };

    private static ScheduleRuleType ToDomain(ScheduleRuleTypeDto ruleType) =>
        ruleType switch
        {
            ScheduleRuleTypeDto.Weekday => ScheduleRuleType.Weekday,
            ScheduleRuleTypeDto.Date => ScheduleRuleType.Date,
            ScheduleRuleTypeDto.Holiday => ScheduleRuleType.Holiday,
            _ => throw new ArgumentOutOfRangeException(nameof(ruleType), ruleType, null)
        };
}
