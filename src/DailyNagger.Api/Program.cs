using DailyNagger.Api.Contracts;
using DailyNagger.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<DailyNaggerDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DailyNagger")));
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

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" })).WithTags("System");

app.MapGet("/api/health/database", async (DailyNaggerDbContext db, CancellationToken cancellationToken) =>
{
    try
    {
        await using var connection = db.Database.GetDbConnection();
        await connection.OpenAsync(cancellationToken);

        return Results.Ok(new { database = "ok" });
    }
    catch (Exception exception)
    {
        return Results.Problem(app.Environment.IsDevelopment() ? exception.ToString() : exception.Message);
    }
}).WithTags("System");

var tasks = new List<TaskSummaryDto>();

app.MapGet("/api/tasks", () => tasks).WithTags("Tasks");

app.MapPost("/api/tasks", (CreateTaskRequest request) =>
{
    var task = new TaskSummaryDto(
        Guid.NewGuid(),
        request.Title,
        TaskStatusDto.Active,
        DateTimeOffset.UtcNow);

    tasks.Add(task);

    return Results.Created($"/api/tasks/{task.Id}", task);
}).WithTags("Tasks");

app.Run();
