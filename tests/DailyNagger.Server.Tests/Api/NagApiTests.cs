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

            var items = await response.Content.ReadFromJsonAsync<NagDto[]>(JsonOptions);

            Assert.NotNull(items);
            Assert.Contains(
                items,
                item => item.Id == testData.NagId
                    && item.Title == testData.Title
                    && item.ActiveLogDueOn == new DateOnly(2026, 6, 1)
                    && !item.IsDeactivated
                    && item.NagTimes.Any(rule =>
                        rule.TimeType == NagTimeTypeDto.Weekly
                        && rule.DayOfWeek == DayOfWeek.Wednesday));
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
        var firstNagLogId = Guid.NewGuid();
        var secondNagLogId = Guid.NewGuid();
        var inactiveNagLogId = Guid.NewGuid();
        var closedNagLogId = Guid.NewGuid();
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

            var firstLogRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                firstNagLogId,
                firstNagId,
                null,
                null,
                [
                    new NagNodeDto(
                        exerciseNodeId,
                        firstNagLogId,
                        null,
                        "Bench press",
                        0,
                        [],
                        [
                            new NagNodeDto(
                                setNodeId,
                                firstNagLogId,
                                exerciseNodeId,
                                "Set 1",
                                0,
                                [
                                    new NagInputDto(
                                        repsInputId,
                                        firstNagLogId,
                                        setNodeId,
                                        "Reps",
                                        null,
                                        NagInputValueTypeDto.Integer,
                                        null,
                                        "10",
                                        0,
                                        "9")
                                ],
                                [])
                        ])
                ]);

            var firstLogResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{firstNagLogId}",
                firstLogRequest,
                JsonOptions);
            var firstLogBody = await firstLogResponse.Content.ReadAsStringAsync();

            Assert.True(firstLogResponse.StatusCode == HttpStatusCode.OK, firstLogBody);

            await SaveEmptyNagLogForPlanAsync(client, testData.CommunityId, userId, secondNagLogId, secondNagId, null);
            await SaveEmptyNagLogForPlanAsync(client, testData.CommunityId, userId, inactiveNagLogId, inactiveNagId, null);
            await SaveEmptyNagLogForPlanAsync(client, testData.CommunityId, userId, closedNagLogId, closedNagId, DateTimeOffset.UtcNow);

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
            Assert.Contains(plan.Nags, nag => nag.Id == firstNagId && nag.NagLog.Id == firstNagLogId);
            Assert.Contains(plan.Nags, nag => nag.Id == secondNagId && nag.NagLog.Id == secondNagLogId);
            Assert.DoesNotContain(plan.Nags, nag => nag.Id == inactiveNagId);
            Assert.DoesNotContain(plan.Nags, nag => nag.Id == closedNagId);

            var firstNag = Assert.Single(plan.Nags, nag => nag.Id == firstNagId);
            var rootNode = Assert.Single(firstNag.NagLog.NagNodes);
            var childNode = Assert.Single(rootNode.NagNodes);
            var input = Assert.Single(childNode.NagInputs);

            Assert.Equal("Gym - Push day", firstNag.Title);
            Assert.False(firstNag.IsDeactivated);
            Assert.Contains(firstNag.NagTimes, nagTime => nagTime.DayOfWeek == DayOfWeek.Monday);
            Assert.Equal("Bench press", rootNode.Name);
            Assert.Equal(exerciseNodeId, childNode.ParentNagNodeId);
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
                null,
                false,
                [
                    new NagTimeDto(
                        nagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Monday,
                        null,
                        null)
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(
                response.StatusCode == HttpStatusCode.OK,
                responseBody);

            using var responseJson = JsonDocument.Parse(responseBody);
            Assert.True(responseJson.RootElement.TryGetProperty("nagTimes", out _));
            Assert.False(responseJson.RootElement.TryGetProperty("times", out _));

            var created = await response.Content.ReadFromJsonAsync<NagDto>(JsonOptions);
            Assert.NotNull(created);
            Assert.Equal(nagId, created.Id);
            Assert.Equal("Created from API test", created.Title);
            Assert.Equal(DayOfWeek.Monday, created.ActiveLogDueOn?.DayOfWeek);
            Assert.False(created.IsDeactivated);
            Assert.Equal(0, created.Version);
            Assert.Contains(
                created.NagTimes,
                rule => rule.Id == nagTimeId
                    && rule.TimeType == NagTimeTypeDto.Weekly
                    && rule.DayOfWeek == DayOfWeek.Monday);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.Nags.AnyAsync(
                nag => nag.Id == nagId
                    && nag.Title == "Created from API test");

            Assert.True(exists);

            var nagTimeExists = await dataDb.NagTimes.AnyAsync(
                nagTime => nagTime.Id == nagTimeId
                    && nagTime.NagId == nagId
                    && nagTime.TimeType == NagTimeType.Weekly
                    && nagTime.DayOfWeek == DayOfWeek.Monday);

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
                false,
                []);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var created = await response.Content.ReadFromJsonAsync<NagDto>(JsonOptions);

            Assert.NotNull(created);
            Assert.Equal(DateOnly.MaxValue, created.ActiveLogDueOn);
            Assert.Empty(created.NagTimes);
            Assert.Equal(0, created.Version);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.NagTimes)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Equal(DateOnly.MaxValue, storedNag.ActiveLogDueOn);
            Assert.Empty(storedNag.NagTimes);

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
        var oldNagTimeId = Guid.NewGuid();
        var newTuesdayNagTimeId = Guid.NewGuid();
        var newThursdayNagTimeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Gym - Push day",
                null,
                false,
                [
                    new NagTimeDto(
                        oldNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Monday,
                        null,
                        null)
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagDto>(JsonOptions);

            Assert.NotNull(created);

            await Task.Delay(20);

            var updateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Gym - Push day updated",
                null,
                false,
                [
                    new NagTimeDto(
                        newTuesdayNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Tuesday,
                        null,
                        null),
                    new NagTimeDto(
                        newThursdayNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Thursday,
                        null,
                        null)
                ],
                created.Version);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                updateRequest,
                JsonOptions);
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<NagDto>(JsonOptions);

            Assert.NotNull(updated);
            Assert.Equal(nagId, updated.Id);
            Assert.Equal("Gym - Push day updated", updated.Title);
            Assert.Equal(1, updated.Version);
            Assert.True(updated.ScheduleUpdatedAt > created.ScheduleUpdatedAt);
            Assert.True(
                updated.ActiveLogDueOn is not null
                    && new[] { DayOfWeek.Tuesday, DayOfWeek.Thursday }
                        .Contains(updated.ActiveLogDueOn.Value.DayOfWeek));
            Assert.DoesNotContain(updated.NagTimes, nagTime => nagTime.Id == oldNagTimeId);
            Assert.Contains(updated.NagTimes, nagTime => nagTime.Id == newTuesdayNagTimeId);
            Assert.Contains(updated.NagTimes, nagTime => nagTime.Id == newThursdayNagTimeId);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.NagTimes)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Gym - Push day updated", storedNag.Title);
            Assert.Equal(1, storedNag.Version);
            Assert.Equal(2, storedNag.NagTimes.Count);
            Assert.DoesNotContain(storedNag.NagTimes, nagTime => nagTime.Id == oldNagTimeId);
            Assert.Contains(storedNag.NagTimes, nagTime => nagTime.Id == newTuesdayNagTimeId);
            Assert.Contains(storedNag.NagTimes, nagTime => nagTime.Id == newThursdayNagTimeId);

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
        var oldNagTimeId = Guid.NewGuid();
        var duplicateNagTimeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Original title",
                null,
                false,
                [
                    new NagTimeDto(
                        oldNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Monday,
                        null,
                        null)
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagDto>(JsonOptions);

            Assert.NotNull(created);

            var invalidUpdateRequest = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Should roll back",
                null,
                false,
                [
                    new NagTimeDto(
                        duplicateNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Tuesday,
                        null,
                        null),
                    new NagTimeDto(
                        duplicateNagTimeId,
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Thursday,
                        null,
                        null)
                ],
                created.Version);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                invalidUpdateRequest,
                JsonOptions);

            Assert.NotEqual(HttpStatusCode.OK, updateResponse.StatusCode);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags
                .Include(nag => nag.NagTimes)
                .SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Original title", storedNag.Title);
            Assert.Equal(0, storedNag.Version);
            Assert.Single(storedNag.NagTimes);
            Assert.Contains(storedNag.NagTimes, nagTime => nagTime.Id == oldNagTimeId);

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
                null,
                false,
                [
                    new NagTimeDto(
                        Guid.NewGuid(),
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Monday,
                        null,
                        null)
                ]);

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
                null,
                false,
                [
                    new NagTimeDto(
                        Guid.NewGuid(),
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Tuesday,
                        null,
                        null)
                ],
                0);

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
                null,
                false,
                [
                    new NagTimeDto(
                        Guid.NewGuid(),
                        NagTimeTypeDto.Weekly,
                        DayOfWeek.Wednesday,
                        null,
                        null)
                ],
                0);

            var staleUpdateResponse = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                staleUpdateRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, staleUpdateResponse.StatusCode);

            await using var dataDb = CreateDataDbContext();
            var storedNag = await dataDb.Nags.SingleAsync(nag => nag.Id == nagId);

            Assert.Equal("Versioned nag first update", storedNag.Title);
            Assert.Equal(1, storedNag.Version);

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
    public async Task Put_nags_returns_bad_request_when_weekly_time_has_no_day_of_week()
    {
        var testData = await CreateRoutedCommunityAsync();
        var nagId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagRequest(
                testData.CommunityId,
                nagId,
                "Invalid weekly rule",
                null,
                false,
                [
                    new NagTimeDto(
                        Guid.NewGuid(),
                        NagTimeTypeDto.Weekly,
                        null,
                        null,
                        null)
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nags/{nagId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Weekly schedule rules require DayOfWeek.", responseBody);

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
    public async Task Put_nag_logs_creates_record_with_client_created_ids_and_nag_nodes()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var benchNodeId = Guid.NewGuid();
        var tricepsNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        benchNodeId,
                        nagLogId,
                        null,
                        "Bench press",
                        0,
                        [],
                        []),
                    new NagNodeDto(
                        tricepsNodeId,
                        nagLogId,
                        null,
                        "Triceps",
                        1,
                        [],
                        [])
                ]);

            var beforeCreate = DateTimeOffset.UtcNow;
            var response = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                request,
                JsonOptions);
            var afterCreate = DateTimeOffset.UtcNow;
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            using var responseJson = JsonDocument.Parse(responseBody);
            Assert.True(responseJson.RootElement.TryGetProperty("nagNodes", out _));
            Assert.False(responseJson.RootElement.TryGetProperty("nodes", out _));

            var created = await response.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);
            Assert.Equal(nagLogId, created.Id);
            Assert.Equal(testData.NagId, created.NagId);
            Assert.Null(created.ClosedOn);
            Assert.InRange(created.UpdatedAt, beforeCreate, afterCreate);
            Assert.Contains(created.NagNodes, node => node.Id == benchNodeId && node.Name == "Bench press");
            Assert.Contains(created.NagNodes, node => node.Id == tricepsNodeId && node.Name == "Triceps");

            await using var dataDb = CreateDataDbContext();
            var storedNagLog = await dataDb.NagLogs
                .Include(nagLog => nagLog.NagNodes)
                .SingleAsync(nagLog => nagLog.Id == nagLogId);

            Assert.Equal(testData.NagId, storedNagLog.NagId);
            Assert.Null(storedNagLog.ClosedOn);
            Assert.Equal(created.UpdatedAt, storedNagLog.UpdatedAt);
            Assert.Equal(2, storedNagLog.NagNodes.Count);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == benchNodeId);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == tricepsNodeId);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_accepts_nested_nag_nodes_and_persists_parent_assertions()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var exerciseNodeId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        exerciseNodeId,
                        nagLogId,
                        null,
                        "Bench press",
                        0,
                        [],
                        [
                            new NagNodeDto(
                                setNodeId,
                                nagLogId,
                                exerciseNodeId,
                                "Set 1",
                                0,
                                [
                                    new NagInputDto(
                                        repsInputId,
                                        nagLogId,
                                        setNodeId,
                                        "Reps",
                                        null,
                                        NagInputValueTypeDto.Integer,
                                        null,
                                        "10",
                                        0)
                                ],
                                [])
                        ])
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var created = await response.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);
            var rootNode = Assert.Single(created.NagNodes);
            var childNode = Assert.Single(rootNode.NagNodes);
            var input = Assert.Single(childNode.NagInputs);

            Assert.Equal(exerciseNodeId, rootNode.Id);
            Assert.Null(rootNode.ParentNagNodeId);
            Assert.Equal(setNodeId, childNode.Id);
            Assert.Equal(exerciseNodeId, childNode.ParentNagNodeId);
            Assert.Equal(nagLogId, childNode.NagLogId);
            Assert.Equal(repsInputId, input.Id);
            Assert.Equal(nagLogId, input.NagLogId);
            Assert.Equal(setNodeId, input.ParentNagNodeId);
            Assert.Null(input.PreviousValue);

            await using var dataDb = CreateDataDbContext();
            var storedNagLog = await dataDb.NagLogs
                .Include(nagLog => nagLog.NagNodes)
                    .ThenInclude(nagNode => nagNode.NagInputs)
                .SingleAsync(nagLog => nagLog.Id == nagLogId);

            Assert.Equal(2, storedNagLog.NagNodes.Count);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == exerciseNodeId && node.ParentNagNodeId is null);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == setNodeId && node.ParentNagNodeId == exerciseNodeId);
            Assert.Contains(
                storedNagLog.NagNodes.SelectMany(node => node.NagInputs),
                input => input.Id == repsInputId
                    && input.NagLogId == nagLogId
                    && input.ParentNagNodeId == setNodeId
                    && input.PreviousValue == null);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_returns_bad_request_when_nested_parent_assertion_does_not_match()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var exerciseNodeId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        exerciseNodeId,
                        nagLogId,
                        null,
                        "Bench press",
                        0,
                        [],
                        [
                            new NagNodeDto(
                                setNodeId,
                                nagLogId,
                                null,
                                "Set 1",
                                0,
                                [],
                                [])
                        ])
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("ParentNagNodeId", responseBody);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.NagLogs.AnyAsync(nagLog => nagLog.Id == nagLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_updates_record_atomically_and_replaces_nag_nodes()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var oldBenchNodeId = Guid.NewGuid();
        var newBenchNodeId = Guid.NewGuid();
        var newTricepsNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        oldBenchNodeId,
                        nagLogId,
                        null,
                        "Bench press",
                        0,
                        [],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);

            var updateRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        newBenchNodeId,
                        nagLogId,
                        null,
                        "Bench press updated",
                        0,
                        [],
                        []),
                    new NagNodeDto(
                        newTricepsNodeId,
                        nagLogId,
                        null,
                        "Triceps",
                        1,
                        [],
                        [])
                ],
                ExpectedVersion: created.Version);

            var beforeUpdate = DateTimeOffset.UtcNow;
            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                updateRequest,
                JsonOptions);
            var afterUpdate = DateTimeOffset.UtcNow;
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(updated);
            Assert.Equal(nagLogId, updated.Id);
            Assert.Equal(1, updated.Version);
            Assert.True(updated.UpdatedAt >= created.UpdatedAt);
            Assert.InRange(updated.UpdatedAt, beforeUpdate, afterUpdate);
            Assert.DoesNotContain(updated.NagNodes, node => node.Id == oldBenchNodeId);
            Assert.Contains(updated.NagNodes, node => node.Id == newBenchNodeId && node.Name == "Bench press updated");
            Assert.Contains(updated.NagNodes, node => node.Id == newTricepsNodeId && node.Name == "Triceps");

            await using var dataDb = CreateDataDbContext();
            var storedNagLog = await dataDb.NagLogs
                .Include(nagLog => nagLog.NagNodes)
                .SingleAsync(nagLog => nagLog.Id == nagLogId);

            Assert.Equal(2, storedNagLog.NagNodes.Count);
            Assert.Equal(1, storedNagLog.Version);
            Assert.Equal(updated.UpdatedAt, storedNagLog.UpdatedAt);
            Assert.DoesNotContain(storedNagLog.NagNodes, node => node.Id == oldBenchNodeId);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == newBenchNodeId);
            Assert.Contains(storedNagLog.NagNodes, node => node.Id == newTricepsNodeId);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_returns_conflict_when_expected_version_is_stale()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        nodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

            var staleUpdateRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        Guid.NewGuid(),
                        nagLogId,
                        null,
                        "Set 1 stale",
                        0,
                        [],
                        [])
                ],
                ExpectedVersion: 99);

            var staleUpdateResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
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
    public async Task Put_nag_logs_creates_and_replaces_nag_inputs_with_valid_value_types()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var noteInputId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();
        var weightInputId = Guid.NewGuid();
        var focusInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                noteInputId,
                                nagLogId,
                                setNodeId,
                                "Kort notat",
                                "Hvordan gik sættet?",
                                NagInputValueTypeDto.Text,
                                null,
                                "Mistede fokus",
                                0),
                            new NagInputDto(
                                repsInputId,
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                "10",
                                1)
                        ],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);
            var createdNode = Assert.Single(created.NagNodes);
            Assert.Contains(createdNode.NagInputs, input => input.Id == noteInputId && input.ValueType == NagInputValueTypeDto.Text);
            Assert.Contains(createdNode.NagInputs, input => input.Id == repsInputId && input.ValueType == NagInputValueTypeDto.Integer);

            var updateRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                weightInputId,
                                nagLogId,
                                setNodeId,
                                "Vægt",
                                "Løftet vægt",
                                NagInputValueTypeDto.Decimal,
                                "kg",
                                "80",
                                0),
                            new NagInputDto(
                                focusInputId,
                                nagLogId,
                                setNodeId,
                                "Fokus",
                                null,
                                NagInputValueTypeDto.Boolean,
                                null,
                                "true",
                                1)
                        ],
                        [])
                ],
                ExpectedVersion: created.Version);

            var updateResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                updateRequest,
                JsonOptions);
            var updateBody = await updateResponse.Content.ReadAsStringAsync();

            Assert.True(updateResponse.StatusCode == HttpStatusCode.OK, updateBody);

            var updated = await updateResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(updated);
            var updatedNode = Assert.Single(updated.NagNodes);
            Assert.DoesNotContain(updatedNode.NagInputs, input => input.Id == noteInputId);
            Assert.DoesNotContain(updatedNode.NagInputs, input => input.Id == repsInputId);
            Assert.Contains(updatedNode.NagInputs, input => input.Id == weightInputId && input.ValueType == NagInputValueTypeDto.Decimal && input.Unit == "kg");
            Assert.Contains(updatedNode.NagInputs, input => input.Id == focusInputId && input.ValueType == NagInputValueTypeDto.Boolean);

            await using var dataDb = CreateDataDbContext();
            var storedNagLog = await dataDb.NagLogs
                .Include(nagLog => nagLog.NagNodes)
                    .ThenInclude(nagNode => nagNode.NagInputs)
                .SingleAsync(nagLog => nagLog.Id == nagLogId);
            var storedNode = Assert.Single(storedNagLog.NagNodes);

            Assert.Equal(2, storedNode.NagInputs.Count);
            Assert.DoesNotContain(storedNode.NagInputs, input => input.Id == noteInputId);
            Assert.DoesNotContain(storedNode.NagInputs, input => input.Id == repsInputId);
            Assert.Contains(storedNode.NagInputs, input => input.Id == weightInputId && input.ValueType == NagInputValueType.Decimal && input.Unit == "kg");
            Assert.Contains(storedNode.NagInputs, input => input.Id == focusInputId && input.ValueType == NagInputValueType.Boolean);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_nag_log_inputs_updates_values_without_replacing_tree()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var weightInputId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                weightInputId,
                                nagLogId,
                                setNodeId,
                                "Weight",
                                null,
                                NagInputValueTypeDto.Decimal,
                                "kg",
                                null,
                                0),
                            new NagInputDto(
                                repsInputId,
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                null,
                                1)
                        ],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);

            var patchRequest = new UpdateNagInputValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new NagInputValueUpdateDto(weightInputId, "80"),
                    new NagInputValueUpdateDto(repsInputId, "10")
                ],
                created.Version);

            var beforePatch = DateTimeOffset.UtcNow;
            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/nag-logs/{nagLogId}/nag-inputs",
                patchRequest,
                JsonOptions);
            var afterPatch = DateTimeOffset.UtcNow;
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.True(patchResponse.StatusCode == HttpStatusCode.OK, patchBody);

            var patchResult = await patchResponse.Content.ReadFromJsonAsync<NagLogVersionDto>(JsonOptions);

            Assert.NotNull(patchResult);
            Assert.Equal(1, patchResult.Version);
            Assert.True(patchResult.UpdatedAt >= created.UpdatedAt);
            Assert.InRange(patchResult.UpdatedAt, beforePatch, afterPatch);

            await using var dataDb = CreateDataDbContext();
            var storedNagLog = await dataDb.NagLogs
                .Include(nagLog => nagLog.NagNodes)
                    .ThenInclude(nagNode => nagNode.NagInputs)
                .SingleAsync(nagLog => nagLog.Id == nagLogId);
            var storedNode = Assert.Single(storedNagLog.NagNodes);

            Assert.Equal(setNodeId, storedNode.Id);
            Assert.Equal(1, storedNagLog.Version);
            Assert.Equal(patchResult.UpdatedAt, storedNagLog.UpdatedAt);
            Assert.Equal(2, storedNode.NagInputs.Count);
            Assert.Contains(storedNode.NagInputs, input => input.Id == weightInputId && input.Value == "80");
            Assert.Contains(storedNode.NagInputs, input => input.Id == repsInputId && input.Value == "10");
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_nag_log_inputs_returns_conflict_when_expected_version_is_stale()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                repsInputId,
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                null,
                                0)
                        ],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

            var patchRequest = new UpdateNagInputValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new NagInputValueUpdateDto(repsInputId, "10")
                ],
                ExpectedVersion: 99);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/nag-logs/{nagLogId}/nag-inputs",
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
    public async Task Patch_nag_log_inputs_returns_conflict_when_nag_log_is_closed()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();
        var closedOn = new DateTimeOffset(2026, 6, 8, 8, 0, 0, TimeSpan.Zero);

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                repsInputId,
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                "8",
                                0)
                        ],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var created = await createResponse.Content.ReadFromJsonAsync<NagLogDto>(JsonOptions);

            Assert.NotNull(created);

            await using (var dataDb = CreateDataDbContext())
            {
                await dataDb.NagLogs
                    .Where(nagLog => nagLog.Id == nagLogId)
                    .ExecuteUpdateAsync(updates => updates
                        .SetProperty(nagLog => nagLog.ClosedOn, closedOn)
                        .SetProperty(nagLog => nagLog.UpdatedAt, closedOn));
            }

            var patchRequest = new UpdateNagInputValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new NagInputValueUpdateDto(repsInputId, "10")
                ],
                created.Version);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/nag-logs/{nagLogId}/nag-inputs",
                patchRequest,
                JsonOptions);

            Assert.Equal(HttpStatusCode.Conflict, patchResponse.StatusCode);

            await using var verifyDb = CreateDataDbContext();
            var storedInput = await verifyDb.NagInputs.SingleAsync(
                input => input.Id == repsInputId);
            var closedNagLog = await verifyDb.NagLogs.SingleAsync(
                nagLog => nagLog.Id == nagLogId);

            Assert.Equal("8", storedInput.Value);
            Assert.Equal(0, closedNagLog.Version);
            Assert.Equal(closedOn, closedNagLog.ClosedOn);
            Assert.Equal(closedOn, closedNagLog.UpdatedAt);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Patch_nag_log_inputs_returns_bad_request_when_input_is_not_in_nag_log()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var patchRequest = new UpdateNagInputValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new NagInputValueUpdateDto(Guid.NewGuid(), "80")
                ]);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/nag-logs/{nagLogId}/nag-inputs",
                patchRequest,
                JsonOptions);
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, patchResponse.StatusCode);
            Assert.Contains("NagInput", patchBody);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_returns_bad_request_when_nag_input_value_does_not_match_value_type()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                "not an integer",
                                0)
                        ],
                        [])
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                request,
                JsonOptions);
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("Integer", responseBody);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.NagLogs.AnyAsync(nagLog => nagLog.Id == nagLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Theory]
    [InlineData(NagInputValueTypeDto.Integer, "10")]
    [InlineData(NagInputValueTypeDto.Decimal, "80.5")]
    [InlineData(NagInputValueTypeDto.Boolean, "true")]
    [InlineData(NagInputValueTypeDto.Boolean, "false")]
    [InlineData(NagInputValueTypeDto.Text, "any text")]
    [InlineData(NagInputValueTypeDto.Text, "")]
    public async Task Put_nag_logs_accepts_values_that_match_value_type(
        NagInputValueTypeDto valueType,
        string value)
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Input",
                                null,
                                valueType,
                                null,
                                value,
                                0)
                        ],
                        [])
                ]);

            var response = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
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
    public async Task Patch_nag_log_inputs_returns_bad_request_when_value_does_not_match_existing_value_type()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var repsInputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var createRequest = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                repsInputId,
                                nagLogId,
                                setNodeId,
                                "Reps",
                                null,
                                NagInputValueTypeDto.Integer,
                                null,
                                null,
                                0)
                        ],
                        [])
                ]);

            var createResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                createRequest,
                JsonOptions);
            var createBody = await createResponse.Content.ReadAsStringAsync();

            Assert.True(createResponse.StatusCode == HttpStatusCode.OK, createBody);

            var patchRequest = new UpdateNagInputValuesRequest(
                testData.CommunityId,
                userId,
                [
                    new NagInputValueUpdateDto(repsInputId, "not an integer")
                ]);

            var patchResponse = await client.PatchAsJsonAsync(
                $"/api/nag-logs/{nagLogId}/nag-inputs",
                patchRequest,
                JsonOptions);
            var patchBody = await patchResponse.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, patchResponse.StatusCode);
            Assert.Contains("Integer", patchBody);

            await using var dataDb = CreateDataDbContext();
            var storedInput = await dataDb.NagInputs.SingleAsync(input => input.Id == repsInputId);

            Assert.Null(storedInput.Value);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Put_nag_logs_returns_bad_request_when_nag_input_value_type_is_invalid()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var nodeId = Guid.NewGuid();
        var inputId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();
            var requestJson = $$"""
            {
              "communityId": "{{testData.CommunityId}}",
              "userId": "{{userId}}",
              "id": "{{nagLogId}}",
              "nagId": "{{testData.NagId}}",
              "copiedFromNagLogId": null,
              "closedOn": null,
              "nagNodes": [
                {
                  "id": "{{nodeId}}",
                  "nagLogId": "{{nagLogId}}",
                  "parentNagNodeId": null,
                  "name": "Set 1",
                  "sortOrder": 0,
                  "nagInputs": [
                    {
                      "id": "{{inputId}}",
                      "nagLogId": "{{nagLogId}}",
                      "parentNagNodeId": "{{nodeId}}",
                      "label": "Bad input",
                      "description": null,
                      "valueType": "Currency",
                      "unit": null,
                      "value": "12",
                      "sortOrder": 0
                    }
                  ],
                  "nagNodes": []
                }
              ]
            }
            """;

            var response = await client.PutAsync(
                $"/api/nag-logs/{nagLogId}",
                new StringContent(requestJson, Encoding.UTF8, "application/json"));
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains("valueType", responseBody, StringComparison.OrdinalIgnoreCase);

            await using var dataDb = CreateDataDbContext();
            var exists = await dataDb.NagLogs.AnyAsync(nagLog => nagLog.Id == nagLogId);

            Assert.False(exists);
        }
        finally
        {
            await DeleteRoutedNagAsync(testData);
        }
    }

    [Fact]
    public async Task Get_nag_input_unit_suggestions_returns_units_saved_from_nag_log_for_user()
    {
        var testData = await CreateRoutedNagAsync();
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var nagLogId = Guid.NewGuid();
        var otherNagLogId = Guid.NewGuid();
        var setNodeId = Guid.NewGuid();
        var otherSetNodeId = Guid.NewGuid();

        try
        {
            using var client = CreateServerClient();

            var request = new SaveNagLogRequest(
                testData.CommunityId,
                userId,
                nagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        setNodeId,
                        nagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Vægt",
                                "Løftet vægt",
                                NagInputValueTypeDto.Decimal,
                                "kg",
                                "80",
                                0),
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Afstand",
                                null,
                                NagInputValueTypeDto.Decimal,
                                "km",
                                "3.2",
                                1),
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Vægt igen",
                                null,
                                NagInputValueTypeDto.Decimal,
                                "kg",
                                "82.5",
                                2),
                            new NagInputDto(
                                Guid.NewGuid(),
                                nagLogId,
                                setNodeId,
                                "Notat",
                                null,
                                NagInputValueTypeDto.Text,
                                null,
                                "Ok",
                                3)
                        ],
                        [])
                ]);

            var saveResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{nagLogId}",
                request,
                JsonOptions);
            var saveBody = await saveResponse.Content.ReadAsStringAsync();

            Assert.True(saveResponse.StatusCode == HttpStatusCode.OK, saveBody);

            var otherUserRequest = new SaveNagLogRequest(
                testData.CommunityId,
                otherUserId,
                otherNagLogId,
                testData.NagId,
                null,
                null,
                [
                    new NagNodeDto(
                        otherSetNodeId,
                        otherNagLogId,
                        null,
                        "Set 1",
                        0,
                        [
                            new NagInputDto(
                                Guid.NewGuid(),
                                otherNagLogId,
                                otherSetNodeId,
                                "Vægt",
                                "Løftet vægt",
                                NagInputValueTypeDto.Decimal,
                                "kg",
                                "80",
                                0),
                            new NagInputDto(
                                Guid.NewGuid(),
                                otherNagLogId,
                                otherSetNodeId,
                                "Afstand",
                                null,
                                NagInputValueTypeDto.Decimal,
                                "km",
                                "3.2",
                                1)
                        ],
                        [])
                ]);

            var otherSaveResponse = await client.PutAsJsonAsync(
                $"/api/nag-logs/{otherNagLogId}",
                otherUserRequest,
                JsonOptions);
            var otherSaveBody = await otherSaveResponse.Content.ReadAsStringAsync();

            Assert.True(otherSaveResponse.StatusCode == HttpStatusCode.OK, otherSaveBody);

            var response = await client.GetAsync(
                $"/api/nag-input-unit-suggestions?communityId={testData.CommunityId}&userId={userId}");
            var responseBody = await response.Content.ReadAsStringAsync();

            Assert.True(response.StatusCode == HttpStatusCode.OK, responseBody);

            var suggestions = await response.Content.ReadFromJsonAsync<string[]>(JsonOptions);

            Assert.NotNull(suggestions);
            Assert.Equal(["kg", "km"], suggestions);
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

        dataDb.Nags.Add(new Nag
        {
            Id = testData.NagId,
            Title = testData.Title,
            ScheduleUpdatedAt = DateTimeOffset.UtcNow,
            ActiveLogDueOn = new DateOnly(2026, 6, 1),
            IsDeactivated = false,
            NagTimes =
            [
                new NagTime
                {
                    TimeType = NagTimeType.Weekly,
                    DayOfWeek = DayOfWeek.Wednesday
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
            null,
            isDeactivated,
            [
                new NagTimeDto(
                    Guid.NewGuid(),
                    NagTimeTypeDto.Weekly,
                    dayOfWeek,
                    null,
                    null)
            ]);

        var response = await client.PutAsJsonAsync(
            $"/api/nags/{nagId}",
            request,
            JsonOptions);
        var body = await response.Content.ReadAsStringAsync();

        Assert.True(response.StatusCode == HttpStatusCode.OK, body);
    }

    private static async Task SaveEmptyNagLogForPlanAsync(
        HttpClient client,
        Guid communityId,
        Guid userId,
        Guid nagLogId,
        Guid nagId,
        DateTimeOffset? closedOn)
    {
        var request = new SaveNagLogRequest(
            communityId,
            userId,
            nagLogId,
            nagId,
            null,
            closedOn,
            []);

        var response = await client.PutAsJsonAsync(
            $"/api/nag-logs/{nagLogId}",
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
        Environment.SetEnvironmentVariable(
            "NagCopyWorker__IsHostedServiceEnabled",
            "false");

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
