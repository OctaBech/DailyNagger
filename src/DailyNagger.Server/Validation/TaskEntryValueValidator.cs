using System.Globalization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Domain;

namespace DailyNagger.Server.Validation;

public static class TaskEntryValueValidator
{
    public static void Validate(TaskEntryValueTypeDto valueType, string? value)
    {
        Validate(valueType.ToString(), value);
    }

    public static void Validate(TaskEntryValueType valueType, string? value)
    {
        Validate(valueType.ToString(), value);
    }

    public static void Validate(string valueType, string? value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return;
        }

        var isValid = valueType switch
        {
            nameof(TaskEntryValueType.Text) => true,
            nameof(TaskEntryValueType.Integer) => int.TryParse(
                value,
                NumberStyles.Integer,
                CultureInfo.InvariantCulture,
                out _),
            nameof(TaskEntryValueType.Decimal) => decimal.TryParse(
                value,
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
                out _),
            nameof(TaskEntryValueType.Boolean) => bool.TryParse(value, out _),
            _ => throw new NagValidationException($"Unknown TaskEntry ValueType: {valueType}.")
        };

        if (!isValid)
        {
            throw new NagValidationException($"TaskEntry value must match {valueType} ValueType.");
        }
    }
}
