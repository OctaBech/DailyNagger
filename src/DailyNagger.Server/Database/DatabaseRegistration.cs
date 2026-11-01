using DailyNagger.Server.Data.Connections;
using DailyNagger.Server.Database.Control;
using DailyNagger.Server.Database.Demo;
using DailyNagger.Server.Database.NagPlans;
using DailyNagger.Server.Database.Nags;
using DailyNagger.Server.Database.System;
using DailyNagger.Server.Database.Tags;
using DailyNagger.Server.Database.TaskLogs;
using DailyNagger.Server.Database.UserMoods;

namespace DailyNagger.Server.Database;

public static class DatabaseRegistration
{
    public static IServiceCollection AddDatabaseOperations(this IServiceCollection services)
    {
        services.AddScoped<ControlDbRead>();
        services.AddScoped<GetDataDbConnection>();
        services.AddScoped<NagRead>();
        services.AddScoped<NagWrite>();
        services.AddScoped<NagPlanRead>();
        services.AddScoped<DatabaseHealthRead>();
        services.AddScoped<TagRead>();
        services.AddScoped<TagWrite>();
        services.AddScoped<TaskLogWrite>();
        services.AddScoped<UserMoodRead>();
        services.AddScoped<UserMoodWrite>();
        services.AddScoped<DemoDataWrite>();
        services.AddScoped<DatabaseQueries>();
        services.AddScoped<DatabaseCommands>();
        return services;
    }
}
