namespace DailyNagger.Server.Operations;

public sealed class NagCopyWorkerOptions
{
    public bool IsHostedServiceEnabled { get; set; } = true;

    public TimeSpan CommunityRefreshInterval { get; set; } = TimeSpan.FromMinutes(5);

    public TimeSpan DelegatorInterval { get; set; } = TimeSpan.FromMinutes(15);

    public TimeSpan CopyGracePeriod { get; set; } = TimeSpan.FromMinutes(10);

    public int MaxParallelCopyWorkers { get; set; } = 4;
}
