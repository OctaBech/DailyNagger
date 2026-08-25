using System.Text.Json.Serialization;
using DailyNagger.Server.Api;
using DailyNagger.Server.Contracts;
using DailyNagger.Server.Data;
using DailyNagger.Server.Observability;
using DailyNagger.Server.Operations;
using DailyNagger.Server.Validation;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);
builder.Configuration.AddEnvironmentVariables();
var sentryDsn = builder.Configuration["Sentry:Dsn"];
var sentryTracesSampleRate = builder.Configuration.GetValue<double?>("Sentry:TracesSampleRate") ?? 1.0;
if (!string.IsNullOrWhiteSpace(sentryDsn))
{
    builder.WebHost.UseSentry(options =>
    {
        options.Dsn = sentryDsn;
        options.TracesSampleRate = sentryTracesSampleRate;
    });
}
builder.Host.UseSerilog((context, services, loggerConfiguration) =>
{
    loggerConfiguration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext();

    if (!string.IsNullOrWhiteSpace(sentryDsn))
    {
        loggerConfiguration.WriteTo.Sentry(options =>
        {
            options.Dsn = sentryDsn;
            options.MinimumBreadcrumbLevel = LogEventLevel.Information;
            options.MinimumEventLevel = LogEventLevel.Error;
        });
    }
}, writeToProviders: false);
builder.Services.AddOpenApi(options =>
{
    options.AddSchemaTransformer<OpenApiContractSchemaTransformer>();
});
builder.Services.AddProblemDetails();
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

if (!app.Environment.IsDevelopment()
    && Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") != "true")
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
