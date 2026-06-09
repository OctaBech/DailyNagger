using DailyNagger.Server.Operations;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Server.Data;

public sealed class DailyNaggerControlDbContext(DbContextOptions<DailyNaggerControlDbContext> options)
    : DbContext(options)
{
    public DbSet<DebugLogTarget> DebugLogTargets => Set<DebugLogTarget>();

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    public DbSet<NagCommunity> NagCommunities => Set<NagCommunity>();

    public DbSet<NagCommunityMember> NagCommunityMembers => Set<NagCommunityMember>();

    public DbSet<NagLogCopyDelegatorStatus> NagLogCopyDelegatorStatuses => Set<NagLogCopyDelegatorStatus>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<DebugLogTarget>(entity =>
        {
            entity.ToTable("debug_log_targets", table =>
            {
                table.HasCheckConstraint(
                    "CK_debug_log_targets_TargetRequired",
                    "AppInstanceId IS NOT NULL OR UserId IS NOT NULL");
            });

            entity.HasKey(target => target.Id);

            entity.Property(target => target.AppInstanceId).HasMaxLength(64);
            entity.Property(target => target.UserId).HasMaxLength(64);
            entity.Property(target => target.MinimumLevel).HasConversion<string>().HasMaxLength(32);
            entity.Property(target => target.Reason).HasMaxLength(500);

            entity.HasIndex(target => target.AppInstanceId);
            entity.HasIndex(target => target.UserId);
            entity.HasIndex(target => target.ExpiresAt);
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.ToTable("user_profiles");

            entity.HasKey(user => user.Id);

            entity.Property(user => user.DisplayName).HasMaxLength(200);
        });

        modelBuilder.Entity<NagCommunity>(entity =>
        {
            entity.ToTable("nag_communities");

            entity.HasKey(community => community.Id);

            entity.Property(community => community.Name).HasMaxLength(200);
            entity.Property(community => community.ConnectionStringTemplate).HasMaxLength(1_000);
            entity.Property(community => community.PasswordSecretName).HasMaxLength(200);
            entity.Property(community => community.IsDeactivated)
                .HasColumnName("is_deactivated")
                .HasDefaultValue(false)
                .IsRequired();
        });

        modelBuilder.Entity<NagCommunityMember>(entity =>
        {
            entity.ToTable("nag_community_members");

            entity.HasKey(member => new { member.NagCommunityId, member.UserId });

            entity.HasOne<NagCommunity>()
                .WithMany()
                .HasForeignKey(member => member.NagCommunityId);

            entity.HasOne<UserProfile>()
                .WithMany()
                .HasForeignKey(member => member.UserId);
        });

        modelBuilder.Entity<NagLogCopyDelegatorStatus>(entity =>
        {
            entity.ToTable("nag_log_copy_delegator_status");

            entity.HasKey(status => status.DelegatorId);

            entity.Property(status => status.DelegatorId)
                .HasColumnName("delegator_id");

            entity.Property(status => status.DelegatorName)
                .HasColumnName("delegator_name")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(status => status.CommunityId)
                .HasColumnName("community_id");

            entity.Property(status => status.Status)
                .HasColumnName("status")
                .HasConversion<string>()
                .HasMaxLength(32)
                .IsRequired();

            entity.Property(status => status.StartedAt)
                .HasColumnName("started_at")
                .IsRequired();

            entity.Property(status => status.LastSeenAt)
                .HasColumnName("last_seen_at")
                .IsRequired();

            entity.Property(status => status.StoppedAt)
                .HasColumnName("stopped_at");

            entity.Property(status => status.LastErrorAt)
                .HasColumnName("last_error_at");

            entity.Property(status => status.LastRunStartedAt)
                .HasColumnName("last_run_started_at");

            entity.Property(status => status.LastRunFinishedAt)
                .HasColumnName("last_run_finished_at");

            entity.Property(status => status.LastRunDurationMs)
                .HasColumnName("last_run_duration_ms")
                .IsRequired();

            entity.Property(status => status.LastRunMaxParallelism)
                .HasColumnName("last_run_max_parallelism")
                .IsRequired();

            entity.Property(status => status.TotalRunCount)
                .HasColumnName("total_run_count")
                .IsRequired();

            entity.Property(status => status.TotalCopiedCount)
                .HasColumnName("total_copied_count")
                .IsRequired();

            entity.Property(status => status.TotalStaleCount)
                .HasColumnName("total_stale_count")
                .IsRequired();

            entity.Property(status => status.TotalNoFutureOccurrenceCount)
                .HasColumnName("total_no_future_occurrence_count")
                .IsRequired();

            entity.Property(status => status.TotalNoOpenLogCount)
                .HasColumnName("total_no_open_log_count")
                .IsRequired();

            entity.Property(status => status.TotalErrorCount)
                .HasColumnName("total_error_count")
                .IsRequired();

            entity.Property(status => status.ErrorCountSinceLastSnapshot)
                .HasColumnName("error_count_since_last_snapshot")
                .IsRequired();

            entity.Property(status => status.TotalDbDurationMs)
                .HasColumnName("total_db_duration_ms")
                .IsRequired();

            entity.Property(status => status.TotalProcessingDurationMs)
                .HasColumnName("total_processing_duration_ms")
                .IsRequired();

            entity.Property(status => status.MaxDbDurationMs)
                .HasColumnName("max_db_duration_ms")
                .IsRequired();

            entity.Property(status => status.MaxProcessingDurationMs)
                .HasColumnName("max_processing_duration_ms")
                .IsRequired();

            entity.Property(status => status.LastDbDurationMs)
                .HasColumnName("last_db_duration_ms")
                .IsRequired();

            entity.Property(status => status.LastProcessingDurationMs)
                .HasColumnName("last_processing_duration_ms")
                .IsRequired();

            entity.HasIndex(status => status.DelegatorName);
            entity.HasIndex(status => status.CommunityId);
            entity.HasIndex(status => status.Status);
            entity.HasIndex(status => status.LastSeenAt);
        });

    }
}
