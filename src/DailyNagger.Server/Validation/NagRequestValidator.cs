using DailyNagger.Server.Contracts;

namespace DailyNagger.Server.Validation;

public sealed class NagRequestValidator
{
    public void Validate(SaveNagRequest request)
    {
        if (request.Id == Guid.Empty)
        {
            throw new NagValidationException("Id is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new NagValidationException("Title is required.");
        }

        foreach (var rule in request.NagTimes)
        {
            ValidateRule(rule);
        }

    }

    public void Validate(SaveNagLogRequest request)
    {
        if (request.Id == Guid.Empty)
        {
            throw new NagValidationException("Id is required.");
        }

        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.NagId == Guid.Empty)
        {
            throw new NagValidationException("NagId is required.");
        }

        var nodeIds = new HashSet<Guid>();
        var inputIds = new HashSet<Guid>();

        foreach (var node in request.NagNodes)
        {
            ValidateNagNode(request.Id, null, node, nodeIds, inputIds);
        }
    }

    public void Validate(UpdateNagInputValuesRequest request)
    {
        if (request.UserId == Guid.Empty)
        {
            throw new NagValidationException("UserId is required.");
        }

        if (request.NagInputs.Length == 0)
        {
            throw new NagValidationException("At least one NagInput update is required.");
        }

        var inputIds = new HashSet<Guid>();

        foreach (var input in request.NagInputs)
        {
            if (input.Id == Guid.Empty)
            {
                throw new NagValidationException("NagInput Id is required.");
            }

            if (!inputIds.Add(input.Id))
            {
                throw new NagValidationException("NagInput Id values must be unique.");
            }
        }
    }

    public static void ValidateNagInputValue(
        NagInputValueTypeDto valueType,
        string? value)
    {
        if (value is null)
        {
            return;
        }

        switch (valueType)
        {
            case NagInputValueTypeDto.Text:
                return;

            case NagInputValueTypeDto.Integer:
                Require(
                    int.TryParse(value, out _),
                    "NagInput value must be a valid Integer.");
                return;

            case NagInputValueTypeDto.Decimal:
                Require(
                    decimal.TryParse(value, out _),
                    "NagInput value must be a valid Decimal.");
                return;

            case NagInputValueTypeDto.Boolean:
                Require(
                    bool.TryParse(value, out _),
                    "NagInput value must be a valid Boolean.");
                return;

            default:
                throw new NagValidationException($"Unknown NagInput value type: {valueType}.");
        }
    }

    private static void ValidateRule(NagTimeDto rule)
    {
        if (rule.Id == Guid.Empty)
        {
            throw new NagValidationException("NagTime Id is required.");
        }

        switch (rule.TimeType)
        {
            case NagTimeTypeDto.Weekly:
                Require(rule.DayOfWeek is not null, "Weekly schedule rules require DayOfWeek.");
                break;

            case NagTimeTypeDto.MonthlyDay:
                Require(rule.DayOfMonth is not null, "MonthlyDay schedule rules require DayOfMonth.");
                break;

            case NagTimeTypeDto.YearlyDate:
                Require(rule.DayOfMonth is not null, "YearlyDate schedule rules require DayOfMonth.");
                Require(rule.MonthOfYear is not null, "YearlyDate schedule rules require MonthOfYear.");
                break;

            default:
                throw new NagValidationException($"Unknown schedule rule type: {rule.TimeType}.");
        }
    }

    private static void ValidateNagNode(
        Guid nagLogId,
        Guid? expectedParentNagNodeId,
        NagNodeDto node,
        HashSet<Guid> nodeIds,
        HashSet<Guid> inputIds)
    {
        if (node.Id == Guid.Empty)
        {
            throw new NagValidationException("NagNode Id is required.");
        }

        if (node.NagLogId != nagLogId)
        {
            throw new NagValidationException("NagNode NagLogId must match the requested NagLog.");
        }

        if (node.ParentNagNodeId != expectedParentNagNodeId)
        {
            throw new NagValidationException("NagNode ParentNagNodeId must match its nested position.");
        }

        if (!nodeIds.Add(node.Id))
        {
            throw new NagValidationException("NagNode Id values must be unique.");
        }

        if (string.IsNullOrWhiteSpace(node.Name))
        {
            throw new NagValidationException("NagNode Name is required.");
        }

        foreach (var input in node.NagInputs)
        {
            ValidateNagInput(nagLogId, node.Id, input, inputIds);
        }

        foreach (var child in node.NagNodes)
        {
            ValidateNagNode(nagLogId, node.Id, child, nodeIds, inputIds);
        }
    }

    private static void ValidateNagInput(
        Guid nagLogId,
        Guid expectedParentNagNodeId,
        NagInputDto input,
        HashSet<Guid> inputIds)
    {
        if (input.Id == Guid.Empty)
        {
            throw new NagValidationException("NagInput Id is required.");
        }

        if (input.NagLogId != nagLogId)
        {
            throw new NagValidationException("NagInput NagLogId must match the requested NagLog.");
        }

        if (input.ParentNagNodeId != expectedParentNagNodeId)
        {
            throw new NagValidationException("NagInput ParentNagNodeId must match its parent NagNode.");
        }

        if (!inputIds.Add(input.Id))
        {
            throw new NagValidationException("NagInput Id values must be unique.");
        }

        if (string.IsNullOrWhiteSpace(input.Label))
        {
            throw new NagValidationException("NagInput Label is required.");
        }

        ValidateNagInputValue(input.ValueType, input.Value);
    }

    private static void Require(bool condition, string message)
    {
        if (!condition)
        {
            throw new NagValidationException(message);
        }
    }
}

public sealed class NagValidationException(string message) : Exception(message);
