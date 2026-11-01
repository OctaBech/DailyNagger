using System.Net;
using DailyNagger.Server.Database.Contexts.Control;
using DailyNagger.Server.Database.Contexts.Tenant;
using DailyNagger.Server.Domain.Control;
using DailyNagger.Server.Domain.Tenant;
using DailyNagger.Server.Observability;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Api;

[Collection(SqlServerTestCollection.Name)]
public sealed class DemoApiTests : SqlServerTestBase
{
    private readonly SqlServerTestFixture fixture;

    public DemoApiTests(SqlServerTestFixture fixture) : base(fixture)
    {
        this.fixture = fixture;
    }

    private readonly Guid community = Guid.NewGuid();
    private readonly Guid template = DailyNagger.Server.Api.Demo.DemoApi.TemplateUserId;
    private readonly Guid user = Guid.NewGuid();

    [Fact]
    public async Task Copy_updates_template_rows_preserves_own_tasks_and_delete_is_user_scoped()
    {
        await using var db = DataDb();
        await SeedCommunity();
        var nag = Guid.NewGuid();
        var log = Guid.NewGuid();
        var root = Guid.NewGuid();
        db.Nags.Add(new Nagger
        {
            Id = nag,
            UserId = template,
            Title = "Template",
            ScheduleRules = [new ScheduleRule { Id = Guid.NewGuid(), UserId = template,
                NagId = nag, RuleType = ScheduleRuleType.Weekday, RuleJson = "{\"weekday\":1}" }]
        });
        db.TaskLogs.Add(new TaskLog
        {
            Id = log,
            UserId = template,
            NagId = nag,
            UpdatedAt = DateTimeOffset.UtcNow,
            TaskItems = [new TaskItem { Id = root, UserId = template, TaskLogId = log, Name = "Root" },
                new TaskItem { Id = Guid.NewGuid(), UserId = template, TaskLogId = log,
                    ParentTaskItemId = root, Name = "Child", TaskEntries = [new TaskEntry {
                        Id = Guid.NewGuid(), UserId = template, TaskLogId = log,
                        ParentTaskItemId = root, Label = "Value", ValueType = TaskEntryValueType.Text,
                        Value = "example" }] }]
        });
        db.UserTags.Add(new UserTag { UserId = template, TagType = "task-item", Name = "demo" });
        db.UserMoods.Add(new UserMood { Id = Guid.NewGuid(), UserId = template, Mood = "calm" });
        var own = Guid.NewGuid();
        var other = Guid.NewGuid();
        db.Nags.Add(new Nagger { Id = own, UserId = user, Title = "Own task" });
        db.Nags.Add(new Nagger { Id = nag, UserId = other, Title = "Other user" });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
        using var factory = Factory();
        using var client = Client(factory);
        var path = $"/api/demo/data?communityId={community}&userId={user}";
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync(path, null)).StatusCode);
        Assert.Equal(2, await db.Nags.CountAsync(x => x.UserId == user));
        Assert.Equal(2, await db.TaskItems.CountAsync(x => x.UserId == user));
        Assert.Single(await db.TaskEntries.Where(x => x.UserId == user).ToArrayAsync());
        Assert.Single(await db.UserTags.Where(x => x.UserId == user).ToArrayAsync());
        Assert.Single(await db.UserMoods.Where(x => x.UserId == user).ToArrayAsync());
        await db.Nags.Where(x => x.UserId == user && x.Id == nag)
            .ExecuteUpdateAsync(set => set.SetProperty(x => x.Title, "Changed"));
        Assert.Equal(HttpStatusCode.OK, (await client.PostAsync(path, null)).StatusCode);
        Assert.Equal("Template", await db.Nags.Where(x => x.UserId == user && x.Id == nag)
            .Select(x => x.Title).SingleAsync());
        Assert.Equal(2, await db.Nags.CountAsync(x => x.UserId == user));
        Assert.Equal("Own task", await db.Nags.Where(x => x.UserId == user && x.Id == own)
            .Select(x => x.Title).SingleAsync());
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync(path)).StatusCode);
        Assert.False(await db.Nags.AnyAsync(x => x.UserId == user));
        Assert.False(await db.ScheduleRules.AnyAsync(x => x.UserId == user));
        Assert.False(await db.TaskLogs.AnyAsync(x => x.UserId == user));
        Assert.False(await db.TaskItems.AnyAsync(x => x.UserId == user));
        Assert.False(await db.TaskEntries.AnyAsync(x => x.UserId == user));
        Assert.False(await db.UserTags.AnyAsync(x => x.UserId == user));
        Assert.False(await db.UserMoods.AnyAsync(x => x.UserId == user));
        Assert.True(await db.Nags.AnyAsync(x => x.UserId == template && x.Id == nag));
        Assert.Equal("Other user", await db.Nags.Where(x => x.UserId == other && x.Id == nag)
            .Select(x => x.Title).SingleAsync());
    }

    [Fact]
    public async Task Missing_template_tasks_leave_the_target_unchanged()
    {
        await SeedCommunity();
        await using var db = DataDb();
        db.Nags.Add(new Nagger { Id = Guid.NewGuid(), UserId = user, Title = "Keep me" });
        await db.SaveChangesAsync();
        using var factory = Factory();
        using var client = Client(factory);
        Assert.Equal(HttpStatusCode.Conflict,
            (await client.PostAsync($"/api/demo/data?communityId={community}&userId={user}", null)).StatusCode);
        Assert.Equal("Keep me", await db.Nags.Where(x => x.UserId == user)
            .Select(x => x.Title).SingleAsync());
    }

    private DailyNaggerDbContext DataDb() => new(new DbContextOptionsBuilder<DailyNaggerDbContext>()
        .UseSqlServer(fixture.DataConnectionString).Options);

    private async Task SeedCommunity()
    {
        await using var control = new DailyNaggerControlDbContext(
            new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
                .UseSqlServer(fixture.ControlConnectionString).Options);
        control.NagCommunities.Add(new NagCommunity
        {
            Id = community,
            Name = "Demo API test",
            IsDemo = true,
            ConnectionStringTemplate = new SqlConnectionStringBuilder(fixture.DataConnectionString)
            { Password = "" }.ConnectionString
        });
        await control.SaveChangesAsync();
    }

    private WebApplicationFactory<Program> Factory() =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["DailyNagger:ApiToken"] = "demo-api-test"
                })));

    private static HttpClient Client(WebApplicationFactory<Program> factory)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "demo-api-test");
        client.DefaultRequestHeaders.Add(ApiRequestHeaders.RequestId, Guid.NewGuid().ToString());
        return client;
    }
}
