namespace DailyNagger.Server.Data.Connections;

public sealed class DataDbConnectionOptions
{
    public int CacheMinutes { get; set; } = 60;
}
