using DailyNagger.Server.Api;
using DailyNagger.Server.Data;
using DailyNagger.Server.Operations;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddOpenApi();
builder.Services.AddMemoryCache();
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
app.MapTaskSeriesApi();

app.Run();

public partial class Program;
