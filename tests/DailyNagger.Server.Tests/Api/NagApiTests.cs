using System.Net;
using System.Text;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Tests.Api;

[Collection(SqlServerTestCollection.Name)]
public sealed class NagApiTests(SqlServerTestFixture fixture) : SqlServerTestBase(fixture)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    [Fact]
    public async Task Get_nags_returns_records_from_community_data_database()
    {
        var testData = await CreateRoutedNagAsync();

        try
        {
            using var client = CreateServerClient();

            var response = await client.GetAsync(
                $"/api/nags?communityId={testData.CommunityId}");
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(
                response.StatusCode == HttpStatusCode.OK,
                responseBody);

            var items = await response.Content.ReadFromJsonAsync<NaggerDto[]>(JsonOptions);

            Assert.NotNull(items);
            Assert.Contains(
                items,
                item => item.Id == testData.NagId
                    && item.Title == testData.Title
                    && item.ActiveLogDueOn == new DateOnly(2026, 6, 1)
                    && !item.IsDeactivated
                    && item.ScheduleRules.Any(rule =>
                        rule.RuleType == ScheduleRuleTypeDto.Wednesday));
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Get_nags_returns_not_found_when_community_does_not_exist()
    {
        using var client = CreateServerClient();

        var response = await client.GetAsync($"/api/nags?communityId={Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/nag-plan")]
    [InlineData("/api/todays-nag-plan")]
    public async Task Get_nag_plan_returns_not_found_when_community_does_not_exist(string route)
    {
        using var client = CreateServerClient();

        var response = await client.GetAsync(
            $"{route}?communityId={Guid.NewGuid()}&userId={Guid.NewGuid()}&date=2026-06-05");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_nag_plan_returns_active_nags_with_open_logs_as_nested_plan()
    {
        var testData = await CreateRoutedCommunityAsync();
        var userId = Guid.NewGuid();
        var firstNagId = Guid.NewGuid();
        var secondNagId = Guid.NewGuid();
        var inactiveNagId = Guid.NewGuid();
        var closedNagId = Guid.NewGuid();
        var firstTaskLogId = Guid.NewGuid();
        var secondTaskLogId = Guid.NewGuid();
        var inactiveTaskLogId = Guid.NewGuid();
        var closedTaskLogId = Guid.NewGuid();
        var exerciseNodeId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();

            await SaveNagForPlanAsync(client, testData.CommunityId, firstNagId, "Gym - Push day", false, DayOfWeek.Monday);
            await SaveNagForPlanAsync(client, testData.CommunityId, secondNagId, "Shopping", false, DayOfWeek.Tuesday);
            await SaveNagForPlanAsync(client, testData.CommunityId, inactiveNagId, "Inactive nag", true, DayOfWeek.Wednesday);
            await SaveNagForPlanAsync(client, testData.CommunityId, closedNagId, "Closed nag", false, DayOfWeek.Thursday);

            var firstLogRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                firstTaskLogId,
                firstNagId,
                null,
                null,
                [
                    new TaskItemDto(
                        exerciseNodeId,
                        firstTaskLogId,
                        null,
                        "Bench press",
                        [],
                        [
                            new TaskItemDto(
                                setNodeId,
                                firstTaskLogId,
                                exerciseNodeId,
                                "Set 1",
                                [
                                    new TaskEntryDto(
                                        repsInputId,
                                        firstTaskLogId,
                                        setNodeId,
                                        "Reps",
                                        null,
                                        TaskEntryValueTypeDto.Integer,
                                        null,
                                        "10",
                                        "9")

                                ],
                                [])
                        ])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var firstLogResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{firstTaskLogId}",
                firstLogRequest,
                JsonOptions);
            var firstLogBody = await firstLogResponse.Content.ReadAsStringAsync();

            Assert.True(firstLogResponse.StatusCode == HttpStatusCode.OK, firstLogBody);

            await SaveEmptyTaskLogForPlanAsync(client, testData.CommunityId, userId, secondTaskLogId, secondNagId, null);
            await SaveEmptyTaskLogForPlanAsync(client, testData.CommunityId, userId, inactiveTaskLogId, inactiveNagId, null);
            await SaveEmptyTaskLogForPlanAsync(client, testData.CommunityId, userId, closedTaskLogId, closedNagId, DateTimeOffset.UtcNow);

            var response = await client.GetAsync(
                $"/api/todays-nag-plan?communityId={testData.CommunityId}&userId={userId}&date=2026-06-05");
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            using var responseJson = JsonDocument.Parse(responseBody);
            Assert.True(responseJson.RootElement.TryGetProperty("date", out _));
            Assert.True(responseJson.RootElement.TryGetProperty("nags", out _));

            var plan = await response.Content.ReadFromJsonAsync<NagPlanDto>(JsonOptions);

            Assert.NotNull(plan);
            Assert.Equal(new DateOnly(2026, 6, 5), plan.Date);
            Assert.Equal(2, plan.Nags.Length);
            Assert.Contains(plan.Nags, nag => nag.Id == firstNagId && nag.TaskLog.Id == firstTaskLogId);
            Assert.Contains(plan.Nags, nag => nag.Id == secondNagId && nag.TaskLog.Id == secondTaskLogId);
            Assert.DoesNotContain(plan.Nags, nag => nag.Id == inactiveNagId);
            Assert.DoesNotContain(plan.Nags, nag => nag.Id == closedNagId);

            var firstNag = Assert.Single(plan.Nags, nag => nag.Id == firstNagId);
            var secondNag = Assert.Single(plan.Nags, nag => nag.Id == secondNagId);
            var rootNode = Assert.Single(firstNag.TaskLog.TaskItems);
            var childNode = Assert.Single(rootNode.TaskItems);
            var input = Assert.Single(childNode.TaskEntries);

            Assert.Equal("Gym - Push day", firstNag.Title);
            Assert.False(firstNag.IsDeactivated);
            Assert.Equal(1, firstNag.TaskLog.Version);
            Assert.Equal(1, secondNag.TaskLog.Version);
            Assert.Contains(firstNag.ScheduleRules, rule => rule.RuleType == ScheduleRuleTypeDto.Monday);
            Assert.Equal("Bench press", rootNode.Name);
            Assert.Equal(exerciseNodeId, childNode.ParentTaskItemId);
            Assert.Equal(repsInputId, input.Id);
            Assert.Equal("10", input.Value);
        }
        finally
        {
            await DeleteRoutedNagsAsync(
                testData.CommunityId,
                firstNagId,
                secondNagId,
                inactiveNagId,
                closedNagId);
        }
    }

    [Fact]
    public async Task Put_nags_creates_record_with_client_created_ids_in_community_data_database()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();
        var nagTimeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Created from API test",
                new DateOnly(2026, 6, 1),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        nagTimeId,
                        ScheduleRuleTypeDto.Monday, null, null, null)
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(
                response.StatusCode == HttpStatusCode.OK,
                responseBody);

            using var responseJson = JsonDocument.Parse(responseBody);
            Assert.True(responseJson.RootElement.TryGetProperty("scheduleRules", out _));
            Assert.False(responseJson.RootElement.TryGetProperty("times", out _));

            var created = await response.Content.ReadFromJsonAsync<NaggerDto>(JsonOptions);
            Assert.NotNull(created);
            Assert.Equal(nagId, created.Id);
            Assert.Equal("Created from API test", created.Title);
            Assert.Equal(new DateOnly(2026, 6, 1), created.ActiveLogDueOn);
            Assert.False(created.IsDeactivated);
            Assert.Equal(request.UpdatedAt, created.UpdatedAt);
            Assert.Equal(1, created.Version);
            Assert.Contains(
                created.ScheduleRules,
                rule => rule.Id == nagTimeId
                    && rule.RuleType == ScheduleRuleTypeDto.Monday);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Created from API test", storedNag.Title);
            Assert.Equal(request.UpdatedAt, storedNag.UpdatedAt);

            var nagTimeExists = await dataDb.ScheduleRules.AnyAsync(
                nagTime => nagTime.Id == nagTimeId
                    && nagTime.NagId == nagId
                    && nagTime.RuleType == ScheduleRuleType.Monday);

            Assert.True(nagTimeExists);

            testData = testData with
            {
                NagId = nagId
            };
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task User_moods_are_saved_idempotently_and_returned_as_history()
    {
        var testData = await CreateRoutedCommunityAsync();
        var userId = Guid.NewGuid();
        var moodId = Guid.NewGuid();
        var recordedAt = new DateTimeOffset(2026, 7, 21, 20, 15, 0, TimeSpan.Zero);

        try
        {
            using var client = CreateServerClient();
            var request = new SaveUserMoodRequest(
                testData.CommunityId,
                userId,
                moodId,
                "upset",
                recordedAt,
                "Europe/Copenhagen",
                "da-DK",
                new ClientIdentityDto(
                    "client-123",
                    "Pixel Test",
                    "Pixel 9"));

            var firstResponse = await client.PostAsJsonAsync(
                "/api/user-moods",
                request,
                JsonOptions);
            var firstBody = await firstResponse.Content.ReadAsStringAsync();

            Assert.True(firstResponse.StatusCode == HttpStatusCode.OK, firstBody);

            var saved = await firstResponse.Content.ReadFromJsonAsync<UserMoodDto>(JsonOptions);

            Assert.NotNull(saved);
            Assert.Equal(moodId, saved.Id);
            Assert.Equal(userId, saved.UserId);
            Assert.Equal("upset", saved.Mood);
            Assert.Equal(recordedAt, saved.RecordedAt);
            Assert.Equal("Europe/Copenhagen", saved.TimeZone);
            Assert.Equal("da-DK", saved.Locale);
            Assert.Equal("client-123", saved.CreatedByClientId);
            Assert.Equal("Pixel Test", saved.CreatedByDeviceName);
            Assert.Equal("Pixel 9", saved.CreatedByDeviceModel);

            var secondResponse = await client.PostAsJsonAsync(
                "/api/user-moods",
                request with
                {
                    Payload = request.Payload with
                    {
                        Mood = "happy"
                    }
                },
                JsonOptions);
            var secondBody = await secondResponse.Content.ReadAsStringAsync();

            Assert.True(secondResponse.StatusCode == HttpStatusCode.OK, secondBody);

            var historyResponse = await client.GetAsync(
                $"/api/user-moods?communityId={testData.CommunityId}&userId={userId}&take=10");
            var historyBody = await historyResponse.Content.ReadAsStringAsync();

            Assert.True(historyResponse.StatusCode == HttpStatusCode.OK, historyBody);

            var history = await historyResponse.Content.ReadFromJsonAsync<UserMoodDto[]>(JsonOptions);

            Assert.NotNull(history);
            var item = Assert.Single(history);
            Assert.Equal(moodId, item.Id);
            Assert.Equal("upset", item.Mood);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_allows_empty_nag_times_and_marks_nag_as_persistent()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Persistent shopping list",
                null,
                null,
                false,
                [],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var created = await response.Content.ReadFromJsonAsync<NaggerDto>(JsonOptions);

            Assert.NotNull(created);
            Assert.Null(created.ActiveLogDueOn);
            Assert.Empty(created.ScheduleRules);
            Assert.Equal(request.UpdatedAt, created.UpdatedAt);
            Assert.Equal(1, created.Version);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.ScheduleRules)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Null(storedNag.ActiveLogDueOn);
            Assert.Equal(request.UpdatedAt, storedNag.UpdatedAt);
            Assert.Empty(storedNag.ScheduleRules);

            testData = testData with
            {
                NagId = nagId
            };
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_updates_record_atomically_and_replaces_nag_times()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();
        var oldScheduleRuleId = Guid.NewGuid();
        var newTuesdayScheduleRuleId = Guid.NewGuid();
        var newThursdayScheduleRuleId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Gym - Push day",
                new DateOnly(2026, 6, 1),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        oldScheduleRuleId,
                        ScheduleRuleTypeDto.Monday, null, null, null)
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NaggerDto>(JsonOptions);

            Assert.NotNull(created);

            await Task.Delay(20);

            var updateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Gym - Push day updated",
                new DateOnly(2026, 6, 10),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        newTuesdayScheduleRuleId,
                        ScheduleRuleTypeDto.Tuesday, null, null, null),
                    new ScheduleRuleDto(
                        newThursdayScheduleRuleId,
                        ScheduleRuleTypeDto.Thursday, null, null, null)

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                updateRequest,
                JsonOptions);
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<NaggerDto>(JsonOptions);

            Assert.NotNull(updated);
            Assert.Equal(nagId, updated.Id);
            Assert.Equal("Gym - Push day updated", updated.Title);
            Assert.Equal(2, updated.Version);
            Assert.Equal(updateRequest.UpdatedAt, updated.UpdatedAt);
            Assert.Equal(new DateOnly(2026, 6, 10), updated.ActiveLogDueOn);
            Assert.DoesNotContain(updated.ScheduleRules, nagTime => nagTime.Id == oldScheduleRuleId);
            Assert.Contains(updated.ScheduleRules, nagTime => nagTime.Id == newTuesdayScheduleRuleId);
            Assert.Contains(updated.ScheduleRules, nagTime => nagTime.Id == newThursdayScheduleRuleId);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.ScheduleRules)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Gym - Push day updated", storedNag.Title);
            Assert.Equal(2, storedNag.Version);
            Assert.Equal(updateRequest.UpdatedAt, storedNag.UpdatedAt);
            Assert.Equal(2, storedNag.ScheduleRules.Count);
            Assert.DoesNotContain(storedNag.ScheduleRules, nagTime => nagTime.Id == oldScheduleRuleId);
            Assert.Contains(storedNag.ScheduleRules, nagTime => nagTime.Id == newTuesdayScheduleRuleId);
            Assert.Contains(storedNag.ScheduleRules, nagTime => nagTime.Id == newThursdayScheduleRuleId);

            testData = testData with
            {
                NagId = nagId
            };
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_rolls_back_update_when_replacing_nag_times_fails()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();
        var oldScheduleRuleId = Guid.NewGuid();
        var duplicateScheduleRuleId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Original title",
                new DateOnly(2026, 6, 1),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        oldScheduleRuleId,
                        ScheduleRuleTypeDto.Monday, null, null, null)
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NaggerDto>(JsonOptions);

            Assert.NotNull(created);

            var invalidUpdateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Should roll back",
                new DateOnly(2026, 6, 3),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        duplicateScheduleRuleId,
                        ScheduleRuleTypeDto.Tuesday, null, null, null),
                    new ScheduleRuleDto(
                        duplicateScheduleRuleId,
                        ScheduleRuleTypeDto.Thursday, null, null, null)

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                invalidUpdateRequest,
                JsonOptions);

            Assert.NotEqual(HttpStatusCode.OK, updateResponse.StatusCode);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.ScheduleRules)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Original title", storedNag.Title);
            Assert.Equal(1, storedNag.Version);
            Assert.Single(storedNag.ScheduleRules);
            Assert.Contains(storedNag.ScheduleRules, nagTime => nagTime.Id == oldScheduleRuleId);

            testData = testData with
            {
                NagId = nagId
            };
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_returns_conflict_when_expected_version_is_stale()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Versioned nag",
                new DateOnly(2026, 6, 1),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        Guid.NewGuid(),
                        ScheduleRuleTypeDto.Monday, null, null, null)
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var firstUpdateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Versioned nag first update",
                new DateOnly(2026, 6, 2),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        Guid.NewGuid(),
                        ScheduleRuleTypeDto.Tuesday, null, null, null)

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 1,
                NextVersion: 2);

            var firstUpdateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                firstUpdateRequest,
                JsonOptions);
            var firstUpdateBody = await firstUpdateResponse.Content.ReadAsStringAsync();

            Assert.True(firstUpdateResponse.StatusCode == HttpStatusCode.OK, firstUpdateBody);

            var staleUpdateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Versioned nag stale update",
                new DateOnly(2026, 6, 3),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        Guid.NewGuid(),
                        ScheduleRuleTypeDto.Wednesday, null, null, null)

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var staleUpdateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                staleUpdateRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, staleUpdateResponse.StatusCode);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Versioned nag first update", storedNag.Title);
            Assert.Equal(2, storedNag.Version);

            testData = testData with
            {
                NagId = nagId
            };
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_returns_bad_request_when_wrapped_payload_version_is_outside_version_span()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new
            {
                testData.CommunityId,
                UserId = Guid.NewGuid(),
                Payload = new NaggerDto(
                    nagId,
                    "Wrapped stale payload",
                    new DateOnly(2026, 6, 1),
                    null,
                    false,
                    DateTimeOffset.UtcNow,
                    null,
                    null,
                    null,
                    [
                        new ScheduleRuleDto(
                            Guid.NewGuid(),
                            ScheduleRuleTypeDto.Monday,
                            null,
                            null,
                            null)
                    ],
                    Version: 5),
                BaseVersion = 0,
                NextVersion = 1
            };

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Payload Version must be between BaseVersion and before NextVersion.", responseBody);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nags_returns_bad_request_when_date_rule_has_no_month()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Invalid date rule",
                new DateOnly(2026, 6, 1),
                null,
                false,
                [
                    new ScheduleRuleDto(
                        Guid.NewGuid(),
                        ScheduleRuleTypeDto.Date,
                        15,
                        null,
                        null)
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Date schedule rules require Month.", responseBody);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.Nags.AnyAsync(
                nag => nag.Id == nagId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_creates_record_with_client_created_ids_and_task_items()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var otherTaskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var otherSetNodeId = Guid.NewGuid();
        var benchNodeId = Guid.NewGuid();
        var tricepsNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        benchNodeId,
                        taskLogId,
                        null,
                        "Bench press",
                        [],
                        []),
                    new TaskItemDto(
                        tricepsNodeId,
                        taskLogId,
                        null,
                        "Triceps",
                        [],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            using var responseJson = JsonDocument.Parse(responseBody);
            Assert.True(responseJson.RootElement.TryGetProperty("taskItems", out _));
            Assert.False(responseJson.RootElement.TryGetProperty("nodes", out _));

            var created = await response.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);
            Assert.Equal(taskLogId, created.Id);
            Assert.Equal(testData.NagId, created.NagId);
            Assert.Null(created.ClosedOn);
            Assert.Equal(request.UpdatedAt, created.UpdatedAt);
            Assert.Contains(created.TaskItems, node => node.Id == benchNodeId && node.Name == "Bench press");
            Assert.Contains(created.TaskItems, node => node.Id == tricepsNodeId && node.Name == "Triceps");

            await using var dataDb = CreateDataDbContext();
            var storedTaskLog = await dataDb.TaskLogs
                .Include(taskLog => taskLog.TaskItems)
                .SingleAsync(taskLog => taskLog.Id == taskLogId);

            Assert.Equal(testData.NagId, storedTaskLog.NagId);
            Assert.Null(storedTaskLog.ClosedOn);
            Assert.Equal(created.UpdatedAt, storedTaskLog.UpdatedAt);
            Assert.Equal(2, storedTaskLog.TaskItems.Count);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == benchNodeId);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == tricepsNodeId);
            Assert.Equal(0, storedTaskLog.TaskItems.Single(node => node.Id == benchNodeId).SortOrder);
            Assert.Equal(1, storedTaskLog.TaskItems.Single(node => node.Id == tricepsNodeId).SortOrder);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_accepts_nested_task_items_and_persists_parent_assertions()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var exerciseNodeId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        exerciseNodeId,
                        taskLogId,
                        null,
                        "Bench press",
                        [],
                        [
                            new TaskItemDto(
                                setNodeId,
                                taskLogId,
                                exerciseNodeId,
                                "Set 1",
                                [
                                    new TaskEntryDto(
                                        repsInputId,
                                        taskLogId,
                                        setNodeId,
                                        "Reps",
                                        null,
                                        TaskEntryValueTypeDto.Integer,
                                        null,
                                        "10")
                                ],
                                [])
                        ])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var created = await response.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);
            var rootNode = Assert.Single(created.TaskItems);
            var childNode = Assert.Single(rootNode.TaskItems);
            var input = Assert.Single(childNode.TaskEntries);

            Assert.Equal(exerciseNodeId, rootNode.Id);
            Assert.Null(rootNode.ParentTaskItemId);
            Assert.Equal(setNodeId, childNode.Id);
            Assert.Equal(exerciseNodeId, childNode.ParentTaskItemId);
            Assert.Equal(taskLogId, childNode.TaskLogId);
            Assert.Equal(repsInputId, input.Id);
            Assert.Equal(taskLogId, input.TaskLogId);
            Assert.Equal(setNodeId, input.ParentTaskItemId);
            Assert.Null(input.LastTaskRunReferenceValue);

            await using var dataDb = CreateDataDbContext();
            var storedTaskLog = await dataDb.TaskLogs
                .Include(taskLog => taskLog.TaskItems)
                    .ThenInclude(taskItem => taskItem.TaskEntries)
                .SingleAsync(taskLog => taskLog.Id == taskLogId);

            Assert.Equal(2, storedTaskLog.TaskItems.Count);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == exerciseNodeId && node.ParentTaskItemId is null);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == setNodeId && node.ParentTaskItemId == exerciseNodeId);
            Assert.Contains(
                storedTaskLog.TaskItems.SelectMany(node => node.TaskEntries),
                input => input.Id == repsInputId
                    && input.TaskLogId == taskLogId
                    && input.ParentTaskItemId == setNodeId
                    && input.LastTaskRunReferenceValue == null);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_returns_bad_request_when_nested_parent_assertion_does_not_match()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var exerciseNodeId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        exerciseNodeId,
                        taskLogId,
                        null,
                        "Bench press",
                        [],
                        [
                            new TaskItemDto(
                                setNodeId,
                                taskLogId,
                                null,
                                "Set 1",
                                [],
                                [])
                        ])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("ParentTaskItemId", responseBody);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.TaskLogs.AnyAsync(taskLog => taskLog.Id == taskLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_updates_record_atomically_and_replaces_task_items()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var oldBenchNodeId = Guid.NewGuid();
        var newBenchNodeId = Guid.NewGuid();
        var newTricepsNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        oldBenchNodeId,
                        taskLogId,
                        null,
                        "Bench press",
                        [],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);

            var updateRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        newBenchNodeId,
                        taskLogId,
                        null,
                        "Bench press updated",
                        [],
                        []),
                    new TaskItemDto(
                        newTricepsNodeId,
                        taskLogId,
                        null,
                        "Triceps",
                        [],
                        [])

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                updateRequest,
                JsonOptions);
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(updated);
            Assert.Equal(taskLogId, updated.Id);
            Assert.Equal(2, updated.Version);
            Assert.Equal(updateRequest.UpdatedAt, updated.UpdatedAt);
            Assert.DoesNotContain(updated.TaskItems, node => node.Id == oldBenchNodeId);
            Assert.Contains(updated.TaskItems, node => node.Id == newBenchNodeId && node.Name == "Bench press updated");
            Assert.Contains(updated.TaskItems, node => node.Id == newTricepsNodeId && node.Name == "Triceps");

            await using var dataDb = CreateDataDbContext();
            var storedTaskLog = await dataDb.TaskLogs
                .Include(taskLog => taskLog.TaskItems)
                .SingleAsync(taskLog => taskLog.Id == taskLogId);

            Assert.Equal(2, storedTaskLog.TaskItems.Count);
            Assert.Equal(2, storedTaskLog.Version);
            Assert.Equal(updated.UpdatedAt, storedTaskLog.UpdatedAt);
            Assert.DoesNotContain(storedTaskLog.TaskItems, node => node.Id == oldBenchNodeId);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == newBenchNodeId);
            Assert.Contains(storedTaskLog.TaskItems, node => node.Id == newTricepsNodeId);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_returns_bad_request_when_wrapped_payload_version_is_outside_version_span()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new
            {
                testData.CommunityId,
                UserId = userId,
                Payload = new TaskLogDto(
                    taskLogId,
                    testData.NagId,
                    null,
                    null,
                    DateTimeOffset.UtcNow,
                    null,
                    null,
                    null,
                    Version: 5,
                    TaskItems: []),
                BaseVersion = 0,
                NextVersion = 1
            };

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Payload Version must be between BaseVersion and before NextVersion.", responseBody);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_returns_conflict_when_expected_version_is_stale()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        nodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

            var staleUpdateRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        Guid.NewGuid(),
                        taskLogId,
                        null,
                        "Set 1 stale",
                        [],
                        [])

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 99,
                NextVersion: 100);

            var staleUpdateResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                staleUpdateRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, staleUpdateResponse.StatusCode);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_creates_and_replaces_task_entries_with_valid_value_types()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var otherTaskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var otherSetNodeId = Guid.NewGuid();
        var noteInputId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();
        var weightInputId = Guid.NewGuid();
        var focusInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                noteInputId,
                                taskLogId,
                                setNodeId,
                                "Kort notat",
                                "Hvordan gik sættet?",
                                TaskEntryValueTypeDto.Text,
                                null,
                                "Mistede fokus"),
                            new TaskEntryDto(
                                repsInputId,
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                "10")
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);
            var createdNode = Assert.Single(created.TaskItems);
            Assert.Contains(createdNode.TaskEntries, input => input.Id == noteInputId && input.ValueType == TaskEntryValueTypeDto.Text);
            Assert.Contains(createdNode.TaskEntries, input => input.Id == repsInputId && input.ValueType == TaskEntryValueTypeDto.Integer);

            var updateRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                weightInputId,
                                taskLogId,
                                setNodeId,
                                "Vægt",
                                "Løftet vægt",
                                TaskEntryValueTypeDto.Decimal,
                                "kg",
                                "80"),
                            new TaskEntryDto(
                                focusInputId,
                                taskLogId,
                                setNodeId,
                                "Fokus",
                                null,
                                TaskEntryValueTypeDto.Boolean,
                                null,
                                "true")
                        ],
                        [])

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                updateRequest,
                JsonOptions);
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(updated);
            var updatedNode = Assert.Single(updated.TaskItems);
            Assert.DoesNotContain(updatedNode.TaskEntries, input => input.Id == noteInputId);
            Assert.DoesNotContain(updatedNode.TaskEntries, input => input.Id == repsInputId);
            Assert.Contains(updatedNode.TaskEntries, input => input.Id == weightInputId && input.ValueType == TaskEntryValueTypeDto.Decimal && input.Tag == "kg");
            Assert.Contains(updatedNode.TaskEntries, input => input.Id == focusInputId && input.ValueType == TaskEntryValueTypeDto.Boolean);

            await using var dataDb = CreateDataDbContext();
            var storedTaskLog = await dataDb.TaskLogs
                .Include(taskLog => taskLog.TaskItems)
                    .ThenInclude(taskItem => taskItem.TaskEntries)
                .SingleAsync(taskLog => taskLog.Id == taskLogId);
            var storedNode = Assert.Single(storedTaskLog.TaskItems);

            Assert.Equal(2, storedNode.TaskEntries.Count);
            Assert.DoesNotContain(storedNode.TaskEntries, input => input.Id == noteInputId);
            Assert.DoesNotContain(storedNode.TaskEntries, input => input.Id == repsInputId);
            Assert.Contains(storedNode.TaskEntries, input => input.Id == weightInputId && input.ValueType == TaskEntryValueType.Decimal && input.Tag == "kg");
            Assert.Contains(storedNode.TaskEntries, input => input.Id == focusInputId && input.ValueType == TaskEntryValueType.Boolean);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_task_log_inputs_updates_values_without_replacing_tree()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var weightInputId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                weightInputId,
                                taskLogId,
                                setNodeId,
                                "Weight",
                                null,
                                TaskEntryValueTypeDto.Decimal,
                                "kg",
                                null),
                            new TaskEntryDto(
                                repsInputId,
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                null)
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);

            var patchRequest = new UpdateTaskEntryValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new TaskEntryValueUpdateDto(weightInputId, "80"),
                    new TaskEntryValueUpdateDto(repsInputId, "10")

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/task-logs/{taskLogId}/task-entries",
                patchRequest,
                JsonOptions);
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.True(patchResponse.StatusCode == HttpStatusCode.OK, patchBody);

            var patchResult = await patchResponse.Content.ReadFromJsonAsync<TaskLogVersionDto>(JsonOptions);

            Assert.NotNull(patchResult);
            Assert.Equal(2, patchResult.Version);
            Assert.Equal(patchRequest.UpdatedAt, patchResult.UpdatedAt);

            await using var dataDb = CreateDataDbContext();
            var storedTaskLog = await dataDb.TaskLogs
                .Include(taskLog => taskLog.TaskItems)
                    .ThenInclude(taskItem => taskItem.TaskEntries)
                .SingleAsync(taskLog => taskLog.Id == taskLogId);
            var storedNode = Assert.Single(storedTaskLog.TaskItems);

            Assert.Equal(setNodeId, storedNode.Id);
            Assert.Equal(2, storedTaskLog.Version);
            Assert.Equal(patchResult.UpdatedAt, storedTaskLog.UpdatedAt);
            Assert.Equal(2, storedNode.TaskEntries.Count);
            Assert.Contains(storedNode.TaskEntries, input => input.Id == weightInputId && input.Value == "80");
            Assert.Contains(storedNode.TaskEntries, input => input.Id == repsInputId && input.Value == "10");
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_task_log_inputs_returns_conflict_when_expected_version_is_stale()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                repsInputId,
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                null)
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

            var patchRequest = new UpdateTaskEntryValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new TaskEntryValueUpdateDto(repsInputId, "10")

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 99,
                NextVersion: 100);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/task-logs/{taskLogId}/task-entries",
                patchRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, patchResponse.StatusCode);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_task_log_inputs_returns_conflict_when_task_log_is_closed()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();
        var closedOn = new DateTimeOffset(2026, 6, 8, 8, 0, 0, TimeSpan.Zero);

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                repsInputId,
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                "8")
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<TaskLogDto>(JsonOptions);

            Assert.NotNull(created);

            await using (var dataDb = CreateDataDbContext())
            {
                await dataDb.TaskLogs
                    .Where(taskLog => taskLog.Id == taskLogId)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(taskLog => taskLog.ClosedOn, closedOn)
                        .SetProperty(taskLog => taskLog.UpdatedAt, closedOn));
            }

            var patchRequest = new UpdateTaskEntryValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new TaskEntryValueUpdateDto(repsInputId, "10")

                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: created.Version,
                NextVersion: created.Version + 1);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/task-logs/{taskLogId}/task-entries",
                patchRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, patchResponse.StatusCode);

            await using var verifyDb = CreateDataDbContext();
            var storedInput = await verifyDb.TaskEntries.SingleAsync(
                input => input.Id == repsInputId);
            var closedTaskLog = await verifyDb.TaskLogs.SingleAsync(
                taskLog => taskLog.Id == taskLogId);

            Assert.Equal("8", storedInput.Value);
            Assert.Equal(1, closedTaskLog.Version);
            Assert.Equal(closedOn, closedTaskLog.ClosedOn);
            Assert.Equal(closedOn, closedTaskLog.UpdatedAt);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_task_log_inputs_returns_bad_request_when_input_is_not_in_task_log()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var patchRequest = new UpdateTaskEntryValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new TaskEntryValueUpdateDto(Guid.NewGuid(), "80")
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/task-logs/{taskLogId}/task-entries",
                patchRequest,
                JsonOptions);
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, patchResponse.StatusCode);
            Assert.Contains("TaskEntry", patchBody);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_returns_bad_request_when_task_entry_value_does_not_match_value_type()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                "not an integer")
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Integer", responseBody);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.TaskLogs.AnyAsync(taskLog => taskLog.Id == taskLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Theory]
    [InlineData(TaskEntryValueTypeDto.Integer, "10")]
    [InlineData(TaskEntryValueTypeDto.Decimal, "80.5")]
    [InlineData(TaskEntryValueTypeDto.Boolean, "true")]
    [InlineData(TaskEntryValueTypeDto.Boolean, "false")]
    [InlineData(TaskEntryValueTypeDto.Text, "any text")]
    [InlineData(TaskEntryValueTypeDto.Text, "")]
    public async Task Put_task_logs_accepts_values_that_match_value_type(
        TaskEntryValueTypeDto valueType,
        string value)
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Input",
                                null,
                                valueType,
                                null,
                                value)
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var response = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_task_log_inputs_returns_bad_request_when_value_does_not_match_existing_value_type()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                repsInputId,
                                taskLogId,
                                setNodeId,
                                "Reps",
                                null,
                                TaskEntryValueTypeDto.Integer,
                                null,
                                null)
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var patchRequest = new UpdateTaskEntryValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new TaskEntryValueUpdateDto(repsInputId, "not an integer")
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/task-logs/{taskLogId}/task-entries",
                patchRequest,
                JsonOptions);
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, patchResponse.StatusCode);
            Assert.Contains("Integer", patchBody);

            await using var dataDb = CreateDataDbContext();
            var storedInput = await dataDb.TaskEntries.SingleAsync(input => input.Id == repsInputId);

            Assert.Null(storedInput.Value);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_task_logs_returns_bad_request_when_task_entry_value_type_is_invalid()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();
        var inputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var requestJson = $$"""
            {
              "communityId": "{{testData.CommunityId}}",
              "userId": "{{userId}}",
              "id": "{{taskLogId}}",
              "nagId": "{{testData.NagId}}",
              "copiedFromTaskLogId": null,
              "closedOn": null,
              "taskItems": [
                {
                  "id": "{{nodeId}}",
                  "taskLogId": "{{taskLogId}}",
                  "parentTaskItemId": null,
                  "name": "Set 1",
                  "taskEntries": [
                    {
                      "id": "{{inputId}}",
                      "taskLogId": "{{taskLogId}}",
                      "parentTaskItemId": "{{nodeId}}",
                      "label": "Bad input",
                      "description": null,
                      "valueType": "Currency",
                      "unit": null,
                      "value": "12"
                    }
                  ],
                  "taskItems": []
                }
              ]
            }
            """;

            var response = await client.PutAsync(
                $"/api/task-logs/{taskLogId}",
                new StringContent(requestJson, Encoding.UTF8, "application/json"));
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("valueType", responseBody, StringComparison.OrdinalIgnoreCase);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.TaskLogs.AnyAsync(taskLog => taskLog.Id == taskLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Save_task_log_does_not_create_tags()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var taskLogId = Guid.NewGuid();
        var otherTaskLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var otherSetNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();

            var request = new SaveTaskLogRequest(
                testData.CommunityId,
                userId,
                taskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        setNodeId,
                        taskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Vægt",
                                "Løftet vægt",
                                TaskEntryValueTypeDto.Decimal,
                                "kg",
                                "80"),
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Afstand",
                                null,
                                TaskEntryValueTypeDto.Decimal,
                                "km",
                                "3.2"),
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Vægt igen",
                                null,
                                TaskEntryValueTypeDto.Decimal,
                                "kg",
                                "82.5"),
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                taskLogId,
                                setNodeId,
                                "Notat",
                                null,
                                TaskEntryValueTypeDto.Text,
                                null,
                                "Ok")
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var saveResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{taskLogId}",
                request,
                JsonOptions);
            var saveBody = await saveResponse.Content.ReadAsStringAsync();

            Assert.True(saveResponse.StatusCode == HttpStatusCode.OK, saveBody);

            var otherUserRequest = new SaveTaskLogRequest(
                testData.CommunityId,
                otherUserId,
                otherTaskLogId,
                testData.NagId,
                null,
                null,
                [
                    new TaskItemDto(
                        otherSetNodeId,
                        otherTaskLogId,
                        null,
                        "Set 1",
                        [
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                otherTaskLogId,
                                otherSetNodeId,
                                "Vægt",
                                "Løftet vægt",
                                TaskEntryValueTypeDto.Decimal,
                                "kg",
                                "80"),
                            new TaskEntryDto(
                                Guid.NewGuid(),
                                otherTaskLogId,
                                otherSetNodeId,
                                "Afstand",
                                null,
                                TaskEntryValueTypeDto.Decimal,
                                "km",
                                "3.2")
                        ],
                        [])
                ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

            var otherSaveResponse = await client.PutAsJsonAsync(
                $"/api/task-logs/{otherTaskLogId}",
                otherUserRequest,
                JsonOptions);
            var otherSaveBody = await otherSaveResponse.Content.ReadAsStringAsync();

            Assert.True(otherSaveResponse.StatusCode == HttpStatusCode.OK, otherSaveBody);

            var response = await client.GetAsync(
                $"/api/tags?communityId={testData.CommunityId}&userId={userId}&tagType=task-entry-unit");
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var tags = await response.Content.ReadFromJsonAsync<TagDto[]>(JsonOptions);

            Assert.NotNull(tags);
            Assert.Empty(tags);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Save_tag_stores_description()
    {
        var testData = await CreateRoutedNagAsync();

        try
        {
            using var client = CreateServerClient();
            var userId = Guid.NewGuid();

            var request = new SaveTagRequest(
                testData.CommunityId,
                userId,
                "task-entry-unit",
                "kg",
                "Kilogram used for strength training entries.");

            var saveResponse = await client.PutAsJsonAsync(
                "/api/tags",
                request,
                JsonOptions);
            var saveBody = await saveResponse.Content.ReadAsStringAsync();

            Assert.True(saveResponse.StatusCode == HttpStatusCode.OK, saveBody);

            var saved = await saveResponse.Content.ReadFromJsonAsync<TagDto>(JsonOptions);

            Assert.NotNull(saved);
            Assert.Equal("kg", saved.Name);
            Assert.Equal("Kilogram used for strength training entries.", saved.Description);
            Assert.NotNull(saved.LastUsedAt);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    private static async Task<RoutedNagTestData> CreateRoutedNagAsync()
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        var testData = new RoutedNagTestData(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "API data read test nag");

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = testData.CommunityId,
            Name = "API data read test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        dataDb.Nags.Add(new Nagger
        {
            Id = testData.NagId,
            Title = testData.Title,
            ActiveLogDueOn = new DateOnly(2026, 6, 1),
            IsDeactivated = false,
            UpdatedAt = new DateTimeOffset(2026, 6, 1, 8, 0, 0, TimeSpan.Zero),
            ScheduleRules =
            [
                new ScheduleRule
                {
                    RuleType = ScheduleRuleType.Wednesday
                }
            ]
        });

        await controlDb.SaveChangesAsync();
        await dataDb.SaveChangesAsync();

        return testData;
    }

    private static async Task SaveNagForPlanAsync(
        HttpClient client,
        Guid communityId,
        Guid nagId,
        string title,
        bool isDeactivated,
        DayOfWeek dayOfWeek)
    {
        var request = new SaveNagRequest(
            communityId,
            nagId,
            title,
            NextDayOfWeek(new DateOnly(2026, 6, 1), dayOfWeek),
            null,
            isDeactivated,
            [
                new ScheduleRuleDto(
                    Guid.NewGuid(),
                    ToScheduleRuleType(dayOfWeek),
                    null,
                    null,
                    null)
            ],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

        var response = await client.PutAsJsonAsync(
            $"/api/nags/{nagId}",
            request,
            JsonOptions);
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.StatusCode == HttpStatusCode.OK, body);
    }

    private static ScheduleRuleTypeDto ToScheduleRuleType(DayOfWeek dayOfWeek) =>
        dayOfWeek switch
        {
            DayOfWeek.Monday => ScheduleRuleTypeDto.Monday,
            DayOfWeek.Tuesday => ScheduleRuleTypeDto.Tuesday,
            DayOfWeek.Wednesday => ScheduleRuleTypeDto.Wednesday,
            DayOfWeek.Thursday => ScheduleRuleTypeDto.Thursday,
            DayOfWeek.Friday => ScheduleRuleTypeDto.Friday,
            DayOfWeek.Saturday => ScheduleRuleTypeDto.Saturday,
            DayOfWeek.Sunday => ScheduleRuleTypeDto.Sunday,
            _ => throw new ArgumentOutOfRangeException(nameof(dayOfWeek), dayOfWeek, null)
        };

    private static DateOnly NextDayOfWeek(DateOnly fromDate, DayOfWeek dayOfWeek)
    {
        var daysUntilMatch = ((int)dayOfWeek - (int)fromDate.DayOfWeek + 7) % 7;
        return fromDate.AddDays(daysUntilMatch);
    }

    private static async Task SaveEmptyTaskLogForPlanAsync(
        HttpClient client,
        Guid communityId,
        Guid userId,
        Guid taskLogId,
        Guid nagId,
        DateTimeOffset? closedOn)
    {
        var request = new SaveTaskLogRequest(
            communityId,
            userId,
            taskLogId,
            nagId,
            null,
            closedOn,
            [],
                UpdatedAt: DateTimeOffset.UtcNow,
                BaseVersion: 0,
                NextVersion: 1);

        var response = await client.PutAsJsonAsync(
            $"/api/task-logs/{taskLogId}",
            request,
            JsonOptions);
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.StatusCode == HttpStatusCode.OK, body);
    }

    private static async Task<RoutedNagTestData> CreateRoutedCommunityAsync()
    {
        await using var controlDb = CreateControlDbContext();

        var testData = new RoutedNagTestData(
            Guid.NewGuid(),
            Guid.Empty,
            "");

        controlDb.NagCommunities.Add(new NagCommunity
        {
            Id = testData.CommunityId,
            Name = "API data write test",
            ConnectionStringTemplate = GetDataConnectionStringTemplate(),
            PasswordSecretName = null
        });

        await controlDb.SaveChangesAsync();

        return testData;
    }

    private static HttpClient CreateServerClient()
    {
        Environment.SetEnvironmentVariable(
            "ConnectionStrings__DailyNaggerControl",
            GetControlConnectionString());
        Environment.SetEnvironmentVariable(
            "DailyNaggerData__Password",
            GetDataPassword());

        var factory = new WebApplicationFactory<Program>();

        return factory.CreateClient();
    }

    private static async Task DeleteRoutedNagAsync(
        RoutedNagTestData testData)
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        if (testData.NagId != Guid.Empty)
        {
            await dataDb.Nags
                .Where(nag => nag.Id == testData.NagId)
                .ExecuteDeleteAsync();
        }

        await controlDb.NagCommunities
            .Where(community => community.Id == testData.CommunityId)
            .ExecuteDeleteAsync();

    }

    private static async Task DeleteRoutedNagsAsync(
        Guid communityId,
        params Guid[] nagIds)
    {
        await using var controlDb = CreateControlDbContext();
        await using var dataDb = CreateDataDbContext();

        await dataDb.Nags
            .Where(nag => nagIds.Contains(nag.Id))
            .ExecuteDeleteAsync();

        await controlDb.NagCommunities
            .Where(community => community.Id == communityId)
            .ExecuteDeleteAsync();
    }

    private static DailyNaggerControlDbContext CreateControlDbContext()
    {
        var options = new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
            .UseSqlServer(GetControlConnectionString())
            .Options;

        return new DailyNaggerControlDbContext(options);
    }

    private static DailyNaggerDbContext CreateDataDbContext()
    {
        var options = new DbContextOptionsBuilder<DailyNaggerDbContext>()
            .UseSqlServer(GetDataConnectionString())
            .Options;

        return new DailyNaggerDbContext(options);
    }

    private static string GetControlConnectionString() =>
        GetConnectionString("DailyNaggerControl");

    private static string GetDataConnectionString() =>
        GetConnectionString("DailyNaggerData");

    private static string GetDataConnectionStringTemplate()
    {
        var builder = new SqlConnectionStringBuilder(GetDataConnectionString())
        {
            Password = string.Empty
        };

        return builder.ConnectionString;
    }

    private static string GetDataPassword()
    {
        var builder = new SqlConnectionStringBuilder(GetDataConnectionString());

        return builder.Password;
    }

    private static string GetConnectionString(string name)
    {
        var environmentValue = Environment.GetEnvironmentVariable(
            $"ConnectionStrings__{name}");

        if (!string.IsNullOrWhiteSpace(environmentValue))
        {
            return environmentValue;
        }

        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            var localSettingsPath = Path.Combine(
                directory.FullName,
                "src",
                "DailyNagger.Server",
                "appsettings.Local.json");

            if (File.Exists(localSettingsPath))
            {
                using var document = JsonDocument.Parse(File.ReadAllText(localSettingsPath));

                return document.RootElement
                    .GetProperty("ConnectionStrings")
                    .GetProperty(name)
                    .GetString()
                    ?? throw new InvalidOperationException(
                        $"ConnectionStrings:{name} is empty.");
            }

            directory = directory.Parent;
        }

        throw new InvalidOperationException(
            $"Missing ConnectionStrings:{name}. Set it as an environment variable or in src/DailyNagger.Server/appsettings.Local.json.");
    }

    private sealed record RoutedNagTestData(
        Guid CommunityId,
        Guid NagId,
        string Title);
}
