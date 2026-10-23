using System.Text.RegularExpressions;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data;
using DailyNagger.Server.Domain;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Tests.Operations;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;

namespace DailyNagger.Server.Tests.Data;

[Collection(SqlServerTestCollection.Name)]
public sealed class UserScopedNodeKeysTests : SqlServerTestBase
{
    private readonly SqlServerTestFixture fixture;

    public UserScopedNodeKeysTests(SqlServerTestFixture fixture) : base(fixture)
    {
        this.fixture = fixture;
    }

    private const string PreviousMigration = "20261020154635_DropNaggerExpiresOn";
    private const string KeyMigration = "20261023170752_ScopeNodeKeysByUser";
    private static readonly DateTimeOffset Stamp = new(2026, 10, 23, 12, 0, 0, TimeSpan.Zero);

    private sealed record GraphIds
    {
        public Guid Nag { get; } = Guid.NewGuid();
        public Guid Rule { get; } = Guid.NewGuid();
        public Guid Log { get; } = Guid.NewGuid();
        public Guid Root { get; } = Guid.NewGuid();
        public Guid Child { get; } = Guid.NewGuid();
        public Guid Entry { get; } = Guid.NewGuid();
        public Guid Mood { get; } = Guid.NewGuid();
    }

    private DailyNaggerDbContext CreateDb(string? connectionString = null) => new(
        new DbContextOptionsBuilder<DailyNaggerDbContext>()
            .UseSqlServer(connectionString ?? fixture.DataConnectionString).Options);

    private static async Task SeedAsync(DailyNaggerDbContext db, Guid user, GraphIds ids, string label)
    {
        db.Nags.Add(new Nagger
        {
            Id = ids.Nag,
            UserId = user,
            Title = label,
            UpdatedAt = Stamp,
            Version = 1,
            ScheduleRules = [new ScheduleRule
            {
                Id = ids.Rule, UserId = user, NagId = ids.Nag,
                RuleType = ScheduleRuleType.Weekday, RuleJson = "{\"weekday\":1}"
            }]
        });
        db.TaskLogs.Add(new TaskLog
        {
            Id = ids.Log,
            UserId = user,
            NagId = ids.Nag,
            UpdatedAt = Stamp,
            Version = 1,
            TaskItems = [new TaskItem
            {
                Id = ids.Root, UserId = user, TaskLogId = ids.Log, Name = label,
                TaskEntries = [new TaskEntry
                {
                    Id = ids.Entry, UserId = user, TaskLogId = ids.Log,
                    ParentTaskItemId = ids.Root, Label = label, ValueType = TaskEntryValueType.Text,
                    Value = label
                }]
            }, new TaskItem
            {
                Id = ids.Child, UserId = user, TaskLogId = ids.Log,
                ParentTaskItemId = ids.Root, Name = label + " child"
            }]
        });
        db.UserMoods.Add(new UserMood
        {
            Id = ids.Mood,
            UserId = user,
            Mood = label,
            RecordedAt = Stamp,
            CreatedAt = Stamp
        });
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();
    }

    private DailyNaggerControlDbContext CreateControlDb() => new(
        new DbContextOptionsBuilder<DailyNaggerControlDbContext>()
            .UseSqlServer(fixture.ControlConnectionString).Options);

    private async Task<(Guid Community, DataDbRead Read, DataDbWrite Write, MemoryCache Cache)> CreateOperationsAsync(
        DailyNaggerControlDbContext db)
    {
        var community = Guid.NewGuid();
        var template = new SqlConnectionStringBuilder(fixture.DataConnectionString) { Password = "" };
        db.NagCommunities.Add(new NagCommunity
        {
            Id = community,
            Name = "User-scoped node keys",
            ConnectionStringTemplate = template.ConnectionString
        });
        await db.SaveChangesAsync();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["DailyNaggerData:Password"] = fixture.DataPassword
        }).Build();
        var connection = new GetDataDbConnection(new ControlDbRead(db), configuration,
            new TestOptionsMonitor<DataDbConnectionOptions>(new() { CacheMinutes = 60 }), cache);
        return (community, new DataDbRead(connection), new DataDbWrite(connection), cache);
    }

    [Fact]
    public async Task Identical_graph_ids_have_isolated_reads_updates_and_tree_deletes()
    {
        await using var db = CreateDb();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var ids = new GraphIds();
        await using var controlDb = CreateControlDb();
        var ops = await CreateOperationsAsync(controlDb);
        using var cache = ops.Cache;

        // Exercise the actual insert/upsert path for nags and rules for both users.
        foreach (var (user, label) in new[] { (a, "A"), (b, "B") })
        {
            await ops.Write.SaveNagAsync(ops.Community, user, ids.Nag, label, null, null, false,
                NaggerPinnedBy.None, Stamp, null,
                [new ScheduleRule { Id = ids.Rule, RuleType = ScheduleRuleType.Weekday, RuleJson = "{\"weekday\":1}" }], 0, 1);
            await ops.Write.SaveTaskLogAsync(ops.Community, user, ids.Log, ids.Nag, null, null, null,
                Stamp, null, 2, 0, 0, 1, Tree(ids, label));
        }

        foreach (var (user, label) in new[] { (a, "A"), (b, "B") })
        {
            var nag = Assert.Single(await ops.Read.GetNagAsync(ops.Community, user));
            Assert.Equal(label, nag.Title);
            Assert.Equal(user, Assert.Single(nag.ScheduleRules).UserId);
            var plan = await ops.Read.GetNagPlanAsync(ops.Community, user, new DateOnly(2026, 10, 23));
            var log = Assert.Single(plan.Nags).TaskLog;
            Assert.All(log.TaskItems, item => Assert.Equal(user, item.UserId));
            Assert.Equal(label, Assert.Single(log.TaskItems.Single(x => x.Id == ids.Root).TaskEntries).Value);
            Assert.Equal(new[] { label, label + " child" },
                (await ops.Read.GetTaskStepNameSuggestionsAsync(ops.Community, user, ids.Nag)).Select(x => x.Name));
        }

        await ops.Write.SaveNagAsync(ops.Community, a, ids.Nag, "A changed", null, null, false,
            NaggerPinnedBy.None, Stamp.AddMinutes(1), null, [], 1, 2);
        await ops.Write.UpdateTaskEntryValuesAsync(ops.Community, a, ids.Log, Stamp.AddMinutes(1), null,
            1, 2, [new TaskEntryValueUpdateDto(ids.Entry, "A changed")]);
        Assert.Equal("A changed", await db.TaskEntries.Where(x => x.UserId == a).Select(x => x.Value).SingleAsync());

        // B still has a child pointing at the identical root id. This catches the old NOT EXISTS bug.
        await ops.Write.SaveTaskLogAsync(ops.Community, a, ids.Log, ids.Nag, null, null, null,
            Stamp.AddMinutes(2), null, 2, 0, 2, 3, Tree(ids, "A replacement"));
        await ops.Write.SaveTaskLogAsync(ops.Community, a, ids.Log, ids.Nag, null, null, null,
            Stamp.AddMinutes(3), null, 0, 0, 3, 4, []);

        Assert.Empty(await db.TaskItems.Where(x => x.UserId == a).ToListAsync());
        Assert.Empty(await db.TaskEntries.Where(x => x.UserId == a).ToListAsync());
        var bNag = Assert.Single(await ops.Read.GetNagAsync(ops.Community, b));
        Assert.Equal("B", bNag.Title);
        Assert.Equal(1, bNag.Version);
        Assert.Single(bNag.ScheduleRules);
        var bLog = await db.TaskLogs.SingleAsync(x => x.UserId == b);
        Assert.Equal(1, bLog.Version);
        Assert.Equal(2, await db.TaskItems.CountAsync(x => x.UserId == b));
        Assert.Equal("B", await db.TaskEntries.Where(x => x.UserId == b).Select(x => x.Value).SingleAsync());
    }

    private static TaskItem[] Tree(GraphIds ids, string label) =>
    [
        new TaskItem
        {
            Id = ids.Root, Name = label,
            TaskEntries = [new TaskEntry { Id = ids.Entry, Label = label, ValueType = TaskEntryValueType.Text, Value = label }]
        },
        new TaskItem { Id = ids.Child, ParentTaskItemId = ids.Root, Name = label + " child" }
    ];

    [Fact]
    public async Task Identical_mood_ids_are_idempotent_per_user()
    {
        await using var controlDb = CreateControlDb();
        var ops = await CreateOperationsAsync(controlDb);
        using var cache = ops.Cache;
        var id = Guid.NewGuid();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        await ops.Write.SaveUserMoodAsync(ops.Community, a, id, "A", Stamp, null, null, null);
        await ops.Write.SaveUserMoodAsync(ops.Community, b, id, "B", Stamp, null, null, null);
        var retry = await ops.Write.SaveUserMoodAsync(ops.Community, a, id, "ignored", Stamp, null, null, null);
        Assert.Equal("A", retry.Mood);
        Assert.Equal("A", Assert.Single(await ops.Read.GetUserMoodsAsync(ops.Community, a, null, null, 10)).Mood);
        Assert.Equal("B", Assert.Single(await ops.Read.GetUserMoodsAsync(ops.Community, b, null, null, 10)).Mood);
    }

    public static TheoryData<string, string, string> Relations => new()
    {
        { "schedule_rule", "nag_id", "nag" },
        { "task_log", "nag_id", "nag" },
        { "task_item", "task_log_id", "task_log" },
        { "task_item", "parent_task_item_id", "task_item" },
        { "task_entry", "parent_task_item_id", "task_item" },
        { "task_entry", "task_log_id", "task_log" }
    };

    [Theory]
    [MemberData(nameof(Relations))]
    public async Task Every_foreign_key_rejects_another_users_parent(string table, string column, string principal)
    {
        await using var db = CreateDb();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var aIds = new GraphIds();
        var bIds = new GraphIds();
        await SeedAsync(db, a, aIds, "A");
        await SeedAsync(db, b, bIds, "B");
        var foreignId = PrincipalId(bIds, principal);
        // Identifiers come exclusively from the fixed Relations test cases; values are parameters.
        var sql = $"update [{table}] set [{column}] = @foreignId where user_id = @user";
        var error = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlRawAsync(
            sql,
            new SqlParameter("@foreignId", foreignId), new SqlParameter("@user", a)));
        Assert.Equal(547, error.Number);
    }

    private static Guid PrincipalId(GraphIds ids, string principal) => principal switch
    {
        "nag" => ids.Nag,
        "task_log" => ids.Log,
        "task_item" => ids.Root,
        _ => throw new ArgumentOutOfRangeException(nameof(principal))
    };

    [Fact]
    public async Task Cascades_are_user_scoped_and_restrict_behavior_is_preserved()
    {
        await using var db = CreateDb();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var ids = new GraphIds();
        await SeedAsync(db, a, ids, "A");
        await SeedAsync(db, b, ids, "B");
        var error = await Assert.ThrowsAsync<SqlException>(() => db.Database.ExecuteSqlInterpolatedAsync(
            $"delete from task_item where user_id = {a} and id = {ids.Root}"));
        Assert.Equal(547, error.Number);
        await db.Database.ExecuteSqlInterpolatedAsync($"delete from task_item where user_id = {a} and id = {ids.Child}");
        // Entry->item still cascades. The log cascade is exercised separately below.
        await db.Database.ExecuteSqlInterpolatedAsync($"delete from task_item where user_id = {a}");
        Assert.Empty(await db.TaskEntries.Where(x => x.UserId == a).ToListAsync());
        await db.Database.ExecuteSqlInterpolatedAsync($"delete from nag where user_id = {a}");
        Assert.Empty(await db.TaskLogs.Where(x => x.UserId == a).ToListAsync());
        Assert.Empty(await db.ScheduleRules.Where(x => x.UserId == a).ToListAsync());
        Assert.Equal(2, await db.TaskItems.CountAsync(x => x.UserId == b));
        Assert.Single(await db.TaskEntries.Where(x => x.UserId == b).ToListAsync());
        Assert.Single(await db.ScheduleRules.Where(x => x.UserId == b).ToListAsync());
        Assert.Single(await db.TaskLogs.Where(x => x.UserId == b).ToListAsync());
    }

    private string MigrationConnectionString() => new SqlConnectionStringBuilder(fixture.DataConnectionString)
    {
        InitialCatalog = $"DailyNaggerData_NodeKeys_Test_{Guid.NewGuid():N}"
    }.ConnectionString;

    [Fact]
    public async Task Migration_and_unique_id_rollback_preserve_all_rows_and_references()
    {
        await using var db = CreateDb(MigrationConnectionString());
        try
        {
            await db.Database.MigrateAsync(PreviousMigration);
            var user = Guid.NewGuid();
            var ids = new GraphIds();
            await SeedAsync(db, user, ids, "Legacy");
            // CopiedFromTaskLogId deliberately remains unconstrained, including existing dangling references.
            var copiedFrom = Guid.NewGuid();
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"update task_log set copied_from_task_log_id = {copiedFrom} where id = {ids.Log}");
            var before = await ReadRowsAsync(db);
            var oldSchema = await ReadKeySchemaAsync(db);
            await db.Database.MigrateAsync();
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.False(db.Database.HasPendingModelChanges());
            var newSchema = await ReadKeySchemaAsync(db);
            Assert.NotEqual(oldSchema, newSchema);
            await AssertForeignKeyActionsAsync(db);
            await db.Database.MigrateAsync(PreviousMigration);
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.Equal(oldSchema, await ReadKeySchemaAsync(db));
            await ExecuteMigrationScriptAsync(db, PreviousMigration, KeyMigration);
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.Equal(newSchema, await ReadKeySchemaAsync(db));
            await ExecuteMigrationScriptAsync(db, KeyMigration, PreviousMigration);
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.Equal(oldSchema, await ReadKeySchemaAsync(db));
        }
        finally { await db.Database.EnsureDeletedAsync(); }
    }

    [Theory]
    [MemberData(nameof(Relations))]
    public async Task Migration_rejects_inconsistent_ownership_before_schema_changes(string table, string column, string principal)
    {
        await using var db = CreateDb(MigrationConnectionString());
        try
        {
            await db.Database.MigrateAsync(PreviousMigration);
            var a = Guid.NewGuid();
            var b = Guid.NewGuid();
            var bIds = new GraphIds();
            await SeedAsync(db, a, new GraphIds(), "A");
            await SeedAsync(db, b, bIds, "B");
            // Old FK accepts the foreign owner's id; the new migration must diagnose it.
            var sql = $"update [{table}] set [{column}] = @foreignId where user_id = @user";
            await db.Database.ExecuteSqlRawAsync(
                sql,
                new SqlParameter("@foreignId", PrincipalId(bIds, principal)), new SqlParameter("@user", a));
            var before = await ReadRowsAsync(db);
            var schema = await ReadKeySchemaAsync(db);
            var error = await Assert.ThrowsAsync<SqlException>(() => db.Database.MigrateAsync());
            Assert.Equal(51000, error.Number);
            Assert.Contains($"{table}.{column}", error.Message);
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.Equal(schema, await ReadKeySchemaAsync(db));
            Assert.DoesNotContain(KeyMigration, await db.Database.GetAppliedMigrationsAsync());
            Assert.Equal(PreviousMigration, (await db.Database.GetAppliedMigrationsAsync()).Last());
        }
        finally { await db.Database.EnsureDeletedAsync(); }
    }

    [Theory]
    [InlineData("nag")]
    [InlineData("schedule_rule")]
    [InlineData("task_log")]
    [InlineData("task_item")]
    [InlineData("task_entry")]
    [InlineData("user_mood")]
    public async Task Rollback_refuses_shared_ids_in_each_table_without_changing_data(string table)
    {
        await using var db = CreateDb(MigrationConnectionString());
        try
        {
            await db.Database.MigrateAsync();
            var a = Guid.NewGuid();
            var b = Guid.NewGuid();
            var aIds = new GraphIds();
            var bIds = new GraphIds();
            await SeedAsync(db, a, aIds, "A");
            await SeedAsync(db, b, bIds, "B");
            // Only the selected table has a duplicate, so each Down guard is exercised.
            // Leaf tables can be updated directly; principal ids are copied as new empty rows.
            var sql = table switch
            {
                "nag" => "insert into nag (id,user_id,title,updated_at,version) values (@id,@user,'duplicate',sysdatetimeoffset(),1)",
                "task_log" => "insert into task_log (id,user_id,nag_id,updated_at,version) values (@id,@user,@nag,sysdatetimeoffset(),1)",
                "task_item" => "insert into task_item (id,user_id,task_log_id,name,sort_order) values (@id,@user,@log,'duplicate',0)",
                _ => $"update [{table}] set id = @id where user_id = @user"
            };
            var duplicate = table switch
            {
                "nag" => aIds.Nag,
                "schedule_rule" => aIds.Rule,
                "task_log" => aIds.Log,
                "task_item" => aIds.Root,
                "task_entry" => aIds.Entry,
                "user_mood" => aIds.Mood,
                _ => throw new ArgumentOutOfRangeException(nameof(table))
            };
            await db.Database.ExecuteSqlRawAsync(sql, new SqlParameter("@id", duplicate),
                new SqlParameter("@user", b), new SqlParameter("@nag", bIds.Nag), new SqlParameter("@log", bIds.Log));
            var before = await ReadRowsAsync(db);
            var schema = await ReadKeySchemaAsync(db);
            var error = await Assert.ThrowsAsync<SqlException>(() => db.Database.MigrateAsync(PreviousMigration));
            Assert.Equal(51001, error.Number);
            Assert.Contains($"{table} contains", error.Message);
            Assert.Equal(before, await ReadRowsAsync(db));
            Assert.Equal(schema, await ReadKeySchemaAsync(db));
            Assert.Contains(KeyMigration, await db.Database.GetAppliedMigrationsAsync());
        }
        finally { await db.Database.EnsureDeletedAsync(); }
    }

    private static async Task<string[]> ReadRowsAsync(DailyNaggerDbContext db)
    {
        var rows = new List<string>();
        await db.Database.OpenConnectionAsync();
        foreach (var table in new[] { "nag", "schedule_rule", "task_log", "task_item", "task_entry", "user_mood" })
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = $"select * from [{table}] order by user_id, id for json path, include_null_values";
            await using var reader = await command.ExecuteReaderAsync();
            var json = new System.Text.StringBuilder();
            while (await reader.ReadAsync()) json.Append(reader.GetString(0));
            rows.Add(json.ToString());
        }
        await db.Database.CloseConnectionAsync();
        return rows.ToArray();
    }

    private static async Task<string[]> ReadKeySchemaAsync(DailyNaggerDbContext db)
    {
        var schema = await db.Database.SqlQueryRaw<string>("""
            select concat(t.name collate database_default, ':', i.name, ':', i.is_primary_key, ':', i.is_unique, ':', c.name, ':', ic.key_ordinal) as Value
            from sys.tables t
            join sys.indexes i on i.object_id = t.object_id
            join sys.index_columns ic on ic.object_id = i.object_id and ic.index_id = i.index_id
            join sys.columns c on c.object_id = ic.object_id and c.column_id = ic.column_id
            where t.name in ('nag','schedule_rule','task_log','task_item','task_entry','user_mood')
            union all
            select concat(f.name collate database_default, ':', f.delete_referential_action_desc, ':', f.is_not_trusted, ':',
                object_name(f.parent_object_id), ':', col_name(fc.parent_object_id,fc.parent_column_id), ':',
                object_name(f.referenced_object_id), ':', col_name(fc.referenced_object_id,fc.referenced_column_id))
            from sys.foreign_keys f
            join sys.foreign_key_columns fc on f.object_id = fc.constraint_object_id
            """).ToArrayAsync();
        return schema.Order(StringComparer.Ordinal).ToArray();
    }

    private static async Task ExecuteMigrationScriptAsync(DailyNaggerDbContext db, string from, string to)
    {
        var script = db.GetService<IMigrator>().GenerateScript(from, to);
        // Keep one connection across GO batches: the generated script owns its transaction.
        await db.Database.OpenConnectionAsync();
        try
        {
            foreach (var batch in Regex.Split(script, @"^[ \t]*GO[ \t]*\r?$", RegexOptions.Multiline | RegexOptions.IgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(batch))
                {
                    await db.Database.ExecuteSqlRawAsync(batch);
                }
            }
        }
        finally
        {
            await db.Database.CloseConnectionAsync();
        }
    }

    private static async Task AssertForeignKeyActionsAsync(DailyNaggerDbContext db)
    {
        var actions = await db.Database.SqlQueryRaw<string>("""
            select concat(object_name(parent_object_id) collate database_default, ':', delete_referential_action_desc) as Value
            from sys.foreign_keys
            order by Value
            """).ToArrayAsync();
        Assert.Equal(new[]
        {
            "schedule_rule:CASCADE", "task_entry:CASCADE", "task_entry:NO_ACTION",
            "task_item:CASCADE", "task_item:NO_ACTION", "task_log:CASCADE"
        }, actions);
    }
}
