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

    }
}
