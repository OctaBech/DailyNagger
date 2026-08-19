using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;

namespace DailyNagger.Server.Tests.Contracts;

public sealed class NagContractSerializationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [Fact]
    public void Versioned_nagger_request_deserializes_payload()
    {
        const string json = """
        {
          "communityId": "11111111-1111-1111-1111-111111111111",
          "userId": "22222222-2222-2222-2222-222222222222",
          "payload": {
            "id": "33333333-3333-3333-3333-333333333333",
            "title": "Contact lenses",
            "activeLogDueOn": "2026-08-17",
            "expiresOn": null,
            "targetTime": "06:35:00",
            "isDeactivated": false,
            "pinnedBy": "None",
            "updatedAt": "2026-08-09T12:29:41.335+00:00",
            "updatedByClientId": "client-1",
            "updatedByDeviceName": "device",
            "updatedByDeviceModel": "model",
            "scheduleRules": [
              {
                "id": "44444444-4444-4444-4444-444444444444",
                "ruleType": "Weekday",
                "ruleJson": "{\"month\":0,\"position\":0,\"weekday\":1}"
              }
            ],
            "version": 3
          },
          "baseVersion": 3,
          "nextVersion": 4,
          "clientIdentity": {
            "clientId": "client-1",
            "deviceName": "device",
            "deviceModel": "model"
          }
        }
        """;

        var request = JsonSerializer.Deserialize<VersionedRequest<NaggerDto>>(
            json,
            JsonOptions);

        Assert.NotNull(request);
        Assert.Equal("Contact lenses", request.Payload.Title);
        Assert.Equal(new TimeOnly(6, 35), request.Payload.TargetTime);
        Assert.Single(request.Payload.ScheduleRules);
    }

    [Fact]
    public void Versioned_task_log_request_deserializes_payload()
    {
        const string json = """
        {
          "communityId": "11111111-1111-1111-1111-111111111111",
          "userId": "22222222-2222-2222-2222-222222222222",
          "payload": {
            "id": "33333333-3333-3333-3333-333333333333",
            "nagId": "44444444-4444-4444-4444-444444444444",
            "copiedFromTaskLogId": "55555555-5555-5555-5555-555555555555",
            "closedOn": null,
            "tag": null,
            "updatedAt": "2026-08-17T08:26:31.686+00:00",
            "updatedByClientId": "client-1",
            "updatedByDeviceName": "device",
            "updatedByDeviceModel": "model",
            "version": 4,
            "taskItems": [
              {
                "id": "66666666-6666-6666-6666-666666666666",
                "taskLogId": "33333333-3333-3333-3333-333333333333",
                "parentTaskItemId": null,
                "name": "Insert",
                "tag": null,
                "taskEntries": [
                  {
                    "id": "77777777-7777-7777-7777-777777777777",
                    "taskLogId": "33333333-3333-3333-3333-333333333333",
                    "parentTaskItemId": "66666666-6666-6666-6666-666666666666",
                    "label": "Left AX60",
                    "description": null,
                    "valueType": "Boolean",
                    "tag": null,
                    "value": "true",
                    "lastTaskRunReferenceValue": "true",
                    "rolloverBehavior": "MoveValueToHistory",
                    "interactionAt": "2026-08-17T08:26:31.419+00:00",
                    "interactionTimeZone": "Europe/Copenhagen",
                    "interactionLocale": "en-GB",
                    "interactionMood": "Let's go",
                    "interactionMoodAt": "2026-08-17T07:34:59.05+00:00"
                  }
                ],
                "taskItems": [],
                "isDone": true,
                "rolloverBehavior": "Keep",
                "interactionAt": "2026-08-17T08:26:34.168+00:00",
                "interactionTimeZone": "Europe/Copenhagen",
                "interactionLocale": "en-GB",
                "interactionMood": "Let's go",
                "interactionMoodAt": "2026-08-17T07:34:59.05+00:00",
                "descendantTaskItemCount": 0,
                "doneDescendantTaskItemCount": 0
              }
            ],
            "descendantTaskItemCount": 1,
            "doneDescendantTaskItemCount": 1
          },
          "baseVersion": 4,
          "nextVersion": 5,
          "clientIdentity": {
            "clientId": "client-1",
            "deviceName": "device",
            "deviceModel": "model"
          }
        }
        """;

        var request = JsonSerializer.Deserialize<VersionedRequest<TaskLogDto>>(
            json,
            JsonOptions);

        Assert.NotNull(request);
        Assert.Equal(4, request.BaseVersion);
        Assert.Equal(5, request.NextVersion);
        Assert.Single(request.Payload.TaskItems);
        Assert.Single(request.Payload.TaskItems[0].TaskEntries);
        Assert.Equal("Insert", request.Payload.TaskItems[0].Name);
        Assert.True(request.Payload.TaskItems[0].IsDone);
        Assert.Equal("Left AX60", request.Payload.TaskItems[0].TaskEntries[0].Label);
    }
}
