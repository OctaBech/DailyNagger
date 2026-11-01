namespace DailyNagger.Server.Database.Connections;

public sealed class DataDbConnectionOptions
{
    public int CacheMinutes { get; set; } = 60;
}
