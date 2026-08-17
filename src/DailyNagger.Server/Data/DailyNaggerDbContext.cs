using DailyNagger.Server.Domain;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Data;

public sealed class DailyNaggerDbContext(DbContextOptions<DailyNaggerDbContext> options)
    : DbContext(options)
{
    public DbSet<Nagger> Nags => Set<Nagger>();
    public DbSet<ScheduleRule> ScheduleRules => Set<ScheduleRule>();
    public DbSet<TaskLog> TaskLogs => Set<TaskLog>();
    public DbSet<TaskItem> TaskItems => Set<TaskItem>();
    public DbSet<TaskEntry> TaskEntries => Set<TaskEntry>();
    public DbSet<UserTag> UserTags => Set<UserTag>();
    public DbSet<UserMood> UserMoods => Set<UserMood>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Nagger>(entity =>
        {
            entity.ToTable("nag");

            entity.HasKey(nag => nag.Id);

            entity.Property(nag => nag.Id)
                .HasColumnName("id");

            entity.Property(nag => nag.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(nag => nag.ActiveLogDueOn)
                .HasColumnName("active_log_due_on")
                .HasColumnType("date");

            entity.Property(nag => nag.ExpiresOn)
                .HasColumnName("expires_on")
                .HasColumnType("date");

            entity.Property(nag => nag.TargetTime)
                .HasColumnName("target_time")
                .HasColumnType("time");

            entity.Property(nag => nag.IsDeactivated)
                .HasColumnName("is_deactivated")
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(nag => nag.PinnedBy)
                .HasColumnName("pinned_by")
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(NaggerPinnedBy.None)
                .IsRequired();

            entity.Property(nag => nag.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(nag => nag.UpdatedByClientId)
                .HasColumnName("updated_by_client_id")
                .HasMaxLength(100);

            entity.Property(nag => nag.UpdatedByDeviceName)
                .HasColumnName("updated_by_device_name")
                .HasMaxLength(200);

            entity.Property(nag => nag.UpdatedByDeviceModel)
                .HasColumnName("updated_by_device_model")
                .HasMaxLength(200);

            entity.Property(nag => nag.Version)
                .HasColumnName("version")
                .HasDefaultValue(0)
                .IsRequired();

            entity.HasMany(nag => nag.ScheduleRules)
                .WithOne()
                .HasForeignKey(rule => rule.NagId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(nag => new
                {
                    nag.IsDeactivated,
                    nag.ActiveLogDueOn
                })
                .HasDatabaseName("IX_nag_is_deactivated_active_log_due_on");

        });

        modelBuilder.Entity<ScheduleRule>(entity =>
        {
            entity.ToTable("schedule_rule");

            entity.HasKey(rule => rule.Id);

            entity.Property(rule => rule.Id)
                .HasColumnName("id");

            entity.Property(rule => rule.NagId)
                .HasColumnName("nag_id");

            entity.Property(rule => rule.RuleType)
                .HasColumnName("rule_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(rule => rule.RuleJson)
                .HasColumnName("rule_json")
                .IsRequired();

            entity.HasIndex(rule => rule.NagId);
        });

        modelBuilder.Entity<TaskLog>(entity =>
        {
            entity.ToTable("task_log", table =>
            {
                table.HasCheckConstraint(
                    "ck_task_log_updated_at_not_default",
                    "updated_at > '0001-01-01T00:00:00+00:00'");
            });

            entity.HasKey(taskLog => taskLog.Id);

            entity.Property(taskLog => taskLog.Id)
                .HasColumnName("id");

            entity.Property(taskLog => taskLog.NagId)
                .HasColumnName("nag_id");

            entity.Property(taskLog => taskLog.CopiedFromTaskLogId)
                .HasColumnName("copied_from_task_log_id");

            entity.Property(taskLog => taskLog.ClosedOn)
                .HasColumnName("closed_on");

            entity.Property(taskLog => taskLog.Tag)
                .HasColumnName("tag")
                .HasMaxLength(50);

            entity.Property(taskLog => taskLog.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(taskLog => taskLog.UpdatedByClientId)
                .HasColumnName("updated_by_client_id")
                .HasMaxLength(100);

            entity.Property(taskLog => taskLog.UpdatedByDeviceName)
                .HasColumnName("updated_by_device_name")
                .HasMaxLength(200);

            entity.Property(taskLog => taskLog.UpdatedByDeviceModel)
                .HasColumnName("updated_by_device_model")
                .HasMaxLength(200);

            entity.Property(taskLog => taskLog.Version)
                .HasColumnName("version")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(taskLog => taskLog.DescendantTaskItemCount)
                .HasColumnName("descendant_task_item_count")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(taskLog => taskLog.DoneDescendantTaskItemCount)
                .HasColumnName("done_descendant_task_item_count")
                .HasDefaultValue(0)
                .IsRequired();

            entity.HasOne<Nagger>()
                .WithMany()
                .HasForeignKey(taskLog => taskLog.NagId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(taskLog => taskLog.TaskItems)
                .WithOne()
                .HasForeignKey(taskItem => taskItem.TaskLogId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(taskLog => taskLog.NagId);
            entity.HasIndex(taskLog => taskLog.CopiedFromTaskLogId);
            entity.HasIndex(taskLog => new
                {
                    taskLog.NagId,
                    taskLog.ClosedOn,
                    taskLog.UpdatedAt
                })
                .HasDatabaseName("IX_task_log_nag_id_closed_on_updated_at");
        });

        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.ToTable("task_item");

            entity.HasKey(taskItem => taskItem.Id);

            entity.Property(taskItem => taskItem.Id)
                .HasColumnName("id");

            entity.Property(taskItem => taskItem.TaskLogId)
                .HasColumnName("task_log_id");

            entity.Property(taskItem => taskItem.ParentTaskItemId)
                .HasColumnName("parent_task_item_id");

            entity.Property(taskItem => taskItem.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(taskItem => taskItem.Tag)
                .HasColumnName("tag")
                .HasMaxLength(50);

            entity.Property(taskItem => taskItem.IsDone)
                .HasColumnName("is_done")
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(taskItem => taskItem.RolloverBehavior)
                .HasColumnName("rollover_behavior")
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(RolloverBehavior.Keep)
                .IsRequired();

            entity.Property(taskItem => taskItem.InteractionAt)
                .HasColumnName("interaction_at");

            entity.Property(taskItem => taskItem.InteractionTimeZone)
                .HasColumnName("interaction_time_zone")
                .HasMaxLength(100);

            entity.Property(taskItem => taskItem.InteractionLocale)
                .HasColumnName("interaction_locale")
                .HasMaxLength(50);

            entity.Property(taskItem => taskItem.InteractionMood)
                .HasColumnName("interaction_mood")
                .HasMaxLength(50);

            entity.Property(taskItem => taskItem.InteractionMoodAt)
                .HasColumnName("interaction_mood_at");

            entity.Property(taskItem => taskItem.DescendantTaskItemCount)
                .HasColumnName("descendant_task_item_count")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(taskItem => taskItem.DoneDescendantTaskItemCount)
                .HasColumnName("done_descendant_task_item_count")
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(taskItem => taskItem.SortOrder)
                .HasColumnName("sort_order")
                .IsRequired();

            entity.HasOne<TaskItem>()
                .WithMany()
                .HasForeignKey(taskItem => taskItem.ParentTaskItemId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(taskItem => taskItem.TaskEntries)
                .WithOne()
                .HasForeignKey(taskEntry => taskEntry.ParentTaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(taskItem => taskItem.TaskLogId);
            entity.HasIndex(taskItem => taskItem.ParentTaskItemId);
        });

        modelBuilder.Entity<TaskEntry>(entity =>
        {
            entity.ToTable("task_entry");

            entity.HasKey(taskEntry => taskEntry.Id);

            entity.Property(taskEntry => taskEntry.Id)
                .HasColumnName("id");

            entity.Property(taskEntry => taskEntry.TaskLogId)
                .HasColumnName("task_log_id");

            entity.Property(taskEntry => taskEntry.ParentTaskItemId)
                .HasColumnName("parent_task_item_id");

            entity.Property(taskEntry => taskEntry.Label)
                .HasColumnName("label")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(taskEntry => taskEntry.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(taskEntry => taskEntry.ValueType)
                .HasColumnName("value_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(taskEntry => taskEntry.Tag)
                .HasColumnName("tag")
                .HasMaxLength(50);

            entity.Property(taskEntry => taskEntry.Value)
                .HasColumnName("value")
                .HasMaxLength(4000);

            entity.Property(taskEntry => taskEntry.LastTaskRunReferenceValue)
                .HasColumnName("last_task_run_reference_value")
                .HasMaxLength(4000);

            entity.Property(taskEntry => taskEntry.RolloverBehavior)
                .HasColumnName("rollover_behavior")
                .HasConversion<string>()
                .HasMaxLength(20)
                .HasDefaultValue(RolloverBehavior.Keep)
                .IsRequired();

            entity.Property(taskEntry => taskEntry.InteractionAt)
                .HasColumnName("interaction_at");

            entity.Property(taskEntry => taskEntry.InteractionTimeZone)
                .HasColumnName("interaction_time_zone")
                .HasMaxLength(100);

            entity.Property(taskEntry => taskEntry.InteractionLocale)
                .HasColumnName("interaction_locale")
                .HasMaxLength(50);

            entity.Property(taskEntry => taskEntry.InteractionMood)
                .HasColumnName("interaction_mood")
                .HasMaxLength(50);

            entity.Property(taskEntry => taskEntry.InteractionMoodAt)
                .HasColumnName("interaction_mood_at");

            entity.Property(taskEntry => taskEntry.SortOrder)
                .HasColumnName("sort_order")
                .IsRequired();

            entity.HasOne<TaskLog>()
                .WithMany()
                .HasForeignKey(taskEntry => taskEntry.TaskLogId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(taskEntry => taskEntry.TaskLogId);
            entity.HasIndex(taskEntry => taskEntry.ParentTaskItemId);
        });

        modelBuilder.Entity<UserTag>(entity =>
        {
            entity.ToTable("user_tag");

            entity.HasKey(tag => new
            {
                tag.UserId,
                tag.TagType,
                tag.Name
            });

            entity.Property(tag => tag.UserId)
                .HasColumnName("user_id");

            entity.Property(tag => tag.TagType)
                .HasColumnName("tag_type")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(tag => tag.Name)
                .HasColumnName("name")
                .UseCollation("Latin1_General_100_CS_AS")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(tag => tag.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(tag => tag.LastUsedAt)
                .HasColumnName("last_used_at");
        });

        modelBuilder.Entity<UserMood>(entity =>
        {
            entity.ToTable("user_mood");

            entity.HasKey(mood => mood.Id);

            entity.Property(mood => mood.Id)
                .HasColumnName("id");

            entity.Property(mood => mood.UserId)
                .HasColumnName("user_id");

            entity.Property(mood => mood.Mood)
                .HasColumnName("mood")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(mood => mood.RecordedAt)
                .HasColumnName("recorded_at")
                .IsRequired();

            entity.Property(mood => mood.TimeZone)
                .HasColumnName("time_zone")
                .HasMaxLength(100);

            entity.Property(mood => mood.Locale)
                .HasColumnName("locale")
                .HasMaxLength(50);

            entity.Property(mood => mood.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(mood => mood.CreatedByClientId)
                .HasColumnName("created_by_client_id")
                .HasMaxLength(100);

            entity.Property(mood => mood.CreatedByDeviceName)
                .HasColumnName("created_by_device_name")
                .HasMaxLength(200);

            entity.Property(mood => mood.CreatedByDeviceModel)
                .HasColumnName("created_by_device_model")
                .HasMaxLength(200);

            entity.HasIndex(mood => new
                {
                    mood.UserId,
                    mood.RecordedAt
                })
                .HasDatabaseName("IX_user_mood_user_id_recorded_at");
        });

    }
}
