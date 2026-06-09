using DailyNagger.Server.Api;
using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Scheduling;
using DailyNagger.Server.Validation;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();

builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddMemoryCache();
builder.Services.Configure<DataDbConnectionOptions>(
    builder.Configuration.GetSection("DataDbConnection"));
builder.Services.Configure<NagCopyWorkerOptions>(
    builder.Configuration.GetSection("NagCopyWorker"));
builder.Services.AddDbContext<DailyNaggerDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DailyNaggerData"),
        sqlServer => sqlServer.EnableRetryOnFailure()));
builder.Services.AddDbContext<DailyNaggerControlDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DailyNaggerControl"),
        sqlServer => sqlServer.EnableRetryOnFailure()));
builder.Services.AddScoped<ControlDbRead>();
builder.Services.AddScoped<GetDataDbConnection>();
builder.Services.AddScoped<DataDbRead>();
builder.Services.AddScoped<DataDbWrite>();
builder.Services.AddScoped<INagLogCopyDelegatorStatusWriter, NagLogCopyDelegatorStatusWriter>();
builder.Services.AddScoped<ICopyLapsedNagLogCommandHandler>(services =>
    services.GetRequiredService<DataDbWrite>());
builder.Services.AddScoped<NagOccurrenceCalculator>();
builder.Services.AddScoped<NagRequestValidator>();
builder.Services.AddSingleton<CommunityLapsedNagLogReconcilerFactory>();
builder.Services.AddHostedService(services => new NagCopyHostedService(
    cancellationToken =>
    {
        var factory = services.GetRequiredService<CommunityLapsedNagLogReconcilerFactory>();

        return factory.Create(cancellationToken).RunUntilCancelledAsync(cancellationToken);
    },
    services.GetRequiredService<Microsoft.Extensions.Options.IOptionsMonitor<NagCopyWorkerOptions>>(),
    services.GetRequiredService<ILogger<NagCopyHostedService>>()));
builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") != "true")
{
    app.UseHttpsRedirection();
}
app.UseCors("client");

app.MapSystemApi();
app.MapNagApi();
app.MapNagPlanApi();
app.MapNagLogApi();
app.MapNagInputUnitSuggestionApi();

app.Run();

public partial class Program;
