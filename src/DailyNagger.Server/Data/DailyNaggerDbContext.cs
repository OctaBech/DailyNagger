using DailyNagger.Server.Domain;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Data;

public sealed class DailyNaggerDbContext(DbContextOptions<DailyNaggerDbContext> options)
    : DbContext(options)
{
    public DbSet<Nag> Nags => Set<Nag>();
    public DbSet<NagTime> NagTimes => Set<NagTime>();
    public DbSet<NagLog> NagLogs => Set<NagLog>();
    public DbSet<NagNode> NagNodes => Set<NagNode>();
    public DbSet<NagInput> NagInputs => Set<NagInput>();
    public DbSet<NagInputUnitSuggestion> NagInputUnitSuggestions => Set<NagInputUnitSuggestion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Nag>(entity =>
        {
            entity.ToTable("nag");

            entity.HasKey(nag => nag.Id);

            entity.Property(nag => nag.Id)
                .HasColumnName("id");

            entity.Property(nag => nag.Title)
                .HasColumnName("title")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(nag => nag.ScheduleUpdatedAt)
                .HasColumnName("schedule_updated_at")
                .IsRequired();

            entity.Property(nag => nag.ActiveLogDueOn)
                .HasColumnName("active_log_due_on")
                .HasColumnType("date");

            entity.Property(nag => nag.ExpiresOn)
                .HasColumnName("expires_on")
                .HasColumnType("date");

            entity.Property(nag => nag.IsDeactivated)
                .HasColumnName("is_deactivated")
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(nag => nag.Version)
                .HasColumnName("version")
                .HasDefaultValue(0)
                .IsRequired();

            entity.HasMany(nag => nag.NagTimes)
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

        modelBuilder.Entity<NagTime>(entity =>
        {
            entity.ToTable("nag_time");

            entity.HasKey(rule => rule.Id);

            entity.Property(rule => rule.Id)
                .HasColumnName("id");

            entity.Property(rule => rule.NagId)
                .HasColumnName("nag_id");

            entity.Property(rule => rule.TimeType)
                .HasColumnName("time_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(rule => rule.DayOfWeek)
                .HasColumnName("day_of_week")
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(rule => rule.DayOfMonth)
                .HasColumnName("day_of_month");

            entity.Property(rule => rule.MonthOfYear)
                .HasColumnName("month_of_year");

            entity.HasIndex(rule => rule.NagId);
        });

        modelBuilder.Entity<NagLog>(entity =>
        {
            entity.ToTable("nag_log", table =>
            {
                table.HasCheckConstraint(
                    "ck_nag_log_updated_at_not_default",
                    "updated_at > '0001-01-01T00:00:00+00:00'");
            });

            entity.HasKey(nagLog => nagLog.Id);

            entity.Property(nagLog => nagLog.Id)
                .HasColumnName("id");

            entity.Property(nagLog => nagLog.NagId)
                .HasColumnName("nag_id");

            entity.Property(nagLog => nagLog.CopiedFromNagLogId)
                .HasColumnName("copied_from_nag_log_id");

            entity.Property(nagLog => nagLog.ClosedOn)
                .HasColumnName("closed_on");

            entity.Property(nagLog => nagLog.UpdatedAt)
                .HasColumnName("updated_at")
                .IsRequired();

            entity.Property(nagLog => nagLog.Version)
                .HasColumnName("version")
                .HasDefaultValue(0)
                .IsRequired();

            entity.HasOne<Nag>()
                .WithMany()
                .HasForeignKey(nagLog => nagLog.NagId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(nagLog => nagLog.NagNodes)
                .WithOne()
                .HasForeignKey(nagNode => nagNode.NagLogId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(nagLog => nagLog.NagId);
            entity.HasIndex(nagLog => nagLog.CopiedFromNagLogId);
            entity.HasIndex(nagLog => new
                {
                    nagLog.NagId,
                    nagLog.ClosedOn,
                    nagLog.UpdatedAt
                })
                .HasDatabaseName("IX_nag_log_nag_id_closed_on_updated_at");
        });

        modelBuilder.Entity<NagNode>(entity =>
        {
            entity.ToTable("nag_node");

            entity.HasKey(nagNode => nagNode.Id);

            entity.Property(nagNode => nagNode.Id)
                .HasColumnName("id");

            entity.Property(nagNode => nagNode.NagLogId)
                .HasColumnName("nag_log_id");

            entity.Property(nagNode => nagNode.ParentNagNodeId)
                .HasColumnName("parent_nag_node_id");

            entity.Property(nagNode => nagNode.Name)
                .HasColumnName("name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(nagNode => nagNode.SortOrder)
                .HasColumnName("sort_order")
                .IsRequired();

            entity.HasOne<NagNode>()
                .WithMany()
                .HasForeignKey(nagNode => nagNode.ParentNagNodeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(nagNode => nagNode.NagInputs)
                .WithOne()
                .HasForeignKey(nagInput => nagInput.ParentNagNodeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(nagNode => nagNode.NagLogId);
            entity.HasIndex(nagNode => nagNode.ParentNagNodeId);
        });

        modelBuilder.Entity<NagInput>(entity =>
        {
            entity.ToTable("nag_input");

            entity.HasKey(nagInput => nagInput.Id);

            entity.Property(nagInput => nagInput.Id)
                .HasColumnName("id");

            entity.Property(nagInput => nagInput.NagLogId)
                .HasColumnName("nag_log_id");

            entity.Property(nagInput => nagInput.ParentNagNodeId)
                .HasColumnName("parent_nag_node_id");

            entity.Property(nagInput => nagInput.Label)
                .HasColumnName("label")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(nagInput => nagInput.Description)
                .HasColumnName("description")
                .HasMaxLength(1000);

            entity.Property(nagInput => nagInput.ValueType)
                .HasColumnName("value_type")
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(nagInput => nagInput.Unit)
                .HasColumnName("unit")
                .HasMaxLength(50);

            entity.Property(nagInput => nagInput.Value)
                .HasColumnName("value")
                .HasMaxLength(4000);

            entity.Property(nagInput => nagInput.PreviousValue)
                .HasColumnName("previous_value")
                .HasMaxLength(4000);

            entity.Property(nagInput => nagInput.SortOrder)
                .HasColumnName("sort_order")
                .IsRequired();

            entity.HasOne<NagLog>()
                .WithMany()
                .HasForeignKey(nagInput => nagInput.NagLogId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(nagInput => nagInput.NagLogId);
            entity.HasIndex(nagInput => nagInput.ParentNagNodeId);
        });

        modelBuilder.Entity<NagInputUnitSuggestion>(entity =>
        {
            entity.ToTable("nag_input_unit_suggestion");

            entity.HasKey(suggestion => new
            {
                suggestion.UserId,
                suggestion.Unit
            });

            entity.Property(suggestion => suggestion.UserId)
                .HasColumnName("user_id");

            entity.Property(suggestion => suggestion.Unit)
                .HasColumnName("unit")
                .HasMaxLength(50)
                .IsRequired();
        });

    }
}
