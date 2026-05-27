using DailyNagger.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace DailyNagger.Api.Data;

public sealed class DailyNaggerDbContext(DbContextOptions<DailyNaggerDbContext> options)
    : DbContext(options)
{
    public DbSet<TaskSeries> TaskSeries => Set<TaskSeries>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TaskSeries>(entity =>
        {
            entity.ToTable("task_series");

            entity.HasKey(series => series.Id);
        });
    }
}
