using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace DailyNagger.Server.Contracts;

public sealed class OpenApiContractSchemaTransformer : IOpenApiSchemaTransformer
{
    private static readonly IReadOnlyDictionary<Type, string[]> RequiredContractProperties =
        new Dictionary<Type, string[]>
        {
            [typeof(TaskLogDto)] =
            [
                "tag",
                "descendantTaskItemCount",
                "doneDescendantTaskItemCount"
            ],
            [typeof(SaveTaskLogRequest)] =
            [
                "tag",
                "descendantTaskItemCount",
                "doneDescendantTaskItemCount"
            ],
            [typeof(TaskItemDto)] =
            [
                "tag",
                "isDone",
                "rolloverBehavior",
                "interactionAt",
                "interactionTimeZone",
                "interactionLocale",
                "interactionMood",
                "interactionMoodAt",
                "descendantTaskItemCount",
                "doneDescendantTaskItemCount"
            ],
            [typeof(TaskEntryDto)] =
            [
                "lastTaskRunReferenceValue",
                "rolloverBehavior",
                "interactionAt",
                "interactionTimeZone",
                "interactionLocale",
                "interactionMood",
                "interactionMoodAt"
            ],
            [typeof(TaskEntryValueUpdateDto)] =
            [
                "interactionAt",
                "interactionTimeZone",
                "interactionLocale",
                "interactionMood",
                "interactionMoodAt"
            ]
        };

    public Task TransformAsync(
        OpenApiSchema schema,
        OpenApiSchemaTransformerContext context,
        CancellationToken cancellationToken)
    {
        NormalizeIntegerSchema(schema);

        if (RequiredContractProperties.TryGetValue(context.JsonTypeInfo.Type, out var requiredProperties))
        {
            schema.Required ??= new HashSet<string>();

            foreach (var propertyName in requiredProperties)
            {
                schema.Required.Add(propertyName);

                if (schema.Properties?.TryGetValue(propertyName, out var propertySchema) == true
                    && propertySchema is OpenApiSchema concretePropertySchema)
                {
                    concretePropertySchema.Default = null;
                }
            }
        }

        return Task.CompletedTask;
    }

    private static void NormalizeIntegerSchema(OpenApiSchema schema)
    {
        if (schema.Type is not { } type
            || !type.HasFlag(JsonSchemaType.Integer)
            || !type.HasFlag(JsonSchemaType.String))
        {
            return;
        }

        schema.Type = JsonSchemaType.Integer;
        schema.Pattern = null;
    }
}
