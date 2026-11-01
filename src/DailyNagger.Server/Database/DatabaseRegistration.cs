using DailyNagger.Server.Database.Commands.Demo;
using DailyNagger.Server.Database.Commands.Nags;
using DailyNagger.Server.Database.Commands.Tags;
using DailyNagger.Server.Database.Commands.TaskLogs;
using DailyNagger.Server.Database.Commands.UserMoods;
using DailyNagger.Server.Database.Connections;
using DailyNagger.Server.Database.Queries.Control;
using DailyNagger.Server.Database.Queries.NagPlans;
using DailyNagger.Server.Database.Queries.Nags;
using DailyNagger.Server.Database.Queries.System;
using DailyNagger.Server.Database.Queries.Tags;
using DailyNagger.Server.Database.Queries.UserMoods;

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
