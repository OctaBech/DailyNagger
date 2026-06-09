using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;

namespace DailyNagger.Server.Api;

public static class NagLogApi
{
    public static IEndpointRouteBuilder MapNagLogApi(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/nag-logs/{id:guid}", async (
            Guid id,
            SaveNagLogRequest request,
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

                var nagLog = await dataDbWrite.SaveNagLogAsync(
                    request.CommunityId,
                    request.UserId,
                    request.Id,
                    request.NagId,
                    request.CopiedFromNagLogId,
                    request.ClosedOn,
                    request.ExpectedVersion,
                    request.NagNodes
                        .SelectMany(node => ToDomainTree(request.Id, null, node))
                        .ToArray(),
                    cancellationToken);

                return Results.Ok(ToDto(nagLog));
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
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
            catch (ConcurrencyConflictException exception)
            {
                return Results.Conflict(new
                {
                    error = exception.Message
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("NagLogs");

        app.MapPatch("/api/nag-logs/{id:guid}/nag-inputs", async (
            Guid id,
            UpdateNagInputValuesRequest request,
            NagRequestValidator validator,
            DataDbWrite dataDbWrite,
            IHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            try
            {
                validator.Validate(request);

                var result = await dataDbWrite.UpdateNagInputValuesAsync(
                    request.CommunityId,
                    id,
                    request.ExpectedVersion,
                    request.NagInputs,
                    cancellationToken);

                return Results.Ok(new NagLogVersionDto(
                    result.Version,
                    result.UpdatedAt));
            }
            catch (NagValidationException exception)
            {
                return Results.BadRequest(new
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
            catch (ConcurrencyConflictException exception)
            {
                return Results.Conflict(new
                {
                    error = exception.Message
                });
            }
            catch (Exception exception)
            {
                return Results.Problem(
                    environment.IsDevelopment() ? exception.ToString() : exception.Message);
            }
        }).WithTags("NagLogs");

        return app;
    }

    private static NagLogDto ToDto(NagLog nagLog) =>
        new(
            nagLog.Id,
            nagLog.NagId,
            nagLog.CopiedFromNagLogId,
            nagLog.ClosedOn,
            nagLog.UpdatedAt,
            nagLog.Version,
            nagLog.NagNodes
                .Where(node => node.ParentNagNodeId is null)
                .OrderBy(node => node.SortOrder)
                .Select(node => ToDto(node, nagLog.NagNodes))
                .ToArray());

    private static NagNodeDto ToDto(
        NagNode node,
        IReadOnlyList<NagNode> allNodes) =>
        new(
            node.Id,
            node.NagLogId,
            node.ParentNagNodeId,
            node.Name,
            node.SortOrder,
            node.NagInputs
                .OrderBy(input => input.SortOrder)
                .Select(ToDto)
                .ToArray(),
            allNodes
                .Where(child => child.ParentNagNodeId == node.Id)
                .OrderBy(child => child.SortOrder)
                .Select(child => ToDto(child, allNodes))
                .ToArray());

    private static NagInputDto ToDto(NagInput input) =>
        new(
            input.Id,
            input.NagLogId,
            input.ParentNagNodeId,
            input.Label,
            input.Description,
            ToDto(input.ValueType),
            input.Unit,
            input.Value,
            input.SortOrder,
            input.PreviousValue);

    private static IEnumerable<NagNode> ToDomainTree(
        Guid nagLogId,
        Guid? parentNagNodeId,
        NagNodeDto node)
    {
        yield return new NagNode
        {
            Id = node.Id,
            NagLogId = nagLogId,
            ParentNagNodeId = parentNagNodeId,
            Name = node.Name.Trim(),
            SortOrder = node.SortOrder,
            NagInputs = node.NagInputs
                .Select(input => ToDomain(nagLogId, node.Id, input))
                .ToList()
        };

        foreach (var child in node.NagNodes.SelectMany(child => ToDomainTree(nagLogId, node.Id, child)))
        {
            yield return child;
        }
    }

    private static NagInput ToDomain(
        Guid nagLogId,
        Guid parentNagNodeId,
        NagInputDto input) =>
        new()
        {
            Id = input.Id,
            NagLogId = nagLogId,
            ParentNagNodeId = parentNagNodeId,
            Label = input.Label.Trim(),
            Description = string.IsNullOrWhiteSpace(input.Description)
                ? null
                : input.Description.Trim(),
            ValueType = ToDomain(input.ValueType),
            Unit = string.IsNullOrWhiteSpace(input.Unit)
                ? null
                : input.Unit.Trim(),
            Value = input.Value,
            PreviousValue = null,
            SortOrder = input.SortOrder
        };

    private static NagInputValueTypeDto ToDto(NagInputValueType valueType) =>
        valueType switch
        {
            NagInputValueType.Text => NagInputValueTypeDto.Text,
            NagInputValueType.Integer => NagInputValueTypeDto.Integer,
            NagInputValueType.Decimal => NagInputValueTypeDto.Decimal,
            NagInputValueType.Boolean => NagInputValueTypeDto.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };

    private static NagInputValueType ToDomain(NagInputValueTypeDto valueType) =>
        valueType switch
        {
            NagInputValueTypeDto.Text => NagInputValueType.Text,
            NagInputValueTypeDto.Integer => NagInputValueType.Integer,
            NagInputValueTypeDto.Decimal => NagInputValueType.Decimal,
            NagInputValueTypeDto.Boolean => NagInputValueType.Boolean,
            _ => throw new ArgumentOutOfRangeException(nameof(valueType), valueType, null)
        };
}
