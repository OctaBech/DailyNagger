using System.Text.Json.Serialization;
using DailyNagger.Server.Api;
using DailyNagger.Server.Data;
using DailyNagger.Server.Observability;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();
builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();
}, writeToProviders: false);
builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddMemoryCache();
builder.Services.Configure<DataDbConnectionOptions>(
    builder.Configuration.GetSection("DataDbConnection"));
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
builder.Services.AddScoped<NagRequestValidator>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("client", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                && (uri.Host == "localhost" || uri.Host == "127.0.0.1"))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") != "true")
{
    app.UseHttpsRedirection();
}
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        if (ApiRequestContext.TryGet(httpContext, out var requestId))
        {
            diagnosticContext.Set("requestId", requestId);
        }
    };
});
app.UseMiddleware<RequireApiRequestIdMiddleware>();
app.UseCors("client");
app.UseMiddleware<ApiTokenMiddleware>();

app.MapSystemApi();
app.MapNagApi();
app.MapNagPlanApi();
app.MapTaskLogApi();
app.MapTagApi();
app.MapTaskStepSuggestionApi();
app.MapUserMoodApi();

app.Run();

public partial class Program;
