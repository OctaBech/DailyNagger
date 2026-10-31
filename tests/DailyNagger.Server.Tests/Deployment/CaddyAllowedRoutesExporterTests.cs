using DailyNagger.Server.Deployment;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace DailyNagger.Server.Tests.Deployment;

public sealed class CaddyAllowedRoutesExporterTests
{
    [Fact]
    public void No_export_argument_leaves_normal_startup_unchanged()
    {
        using var app = WebApplication.CreateBuilder().Build();
        Assert.False(CaddyAllowedRoutesExporter.TryExport(app, []));
    }

    [Fact]
    public void Export_preserves_methods_replaces_parameters_and_deduplicates_before_numbering()
    {
        using var app = WebApplication.CreateBuilder().Build();
        foreach (string path in new[] { "/api/tags", "/api/tags" })
        {
            app.MapGet(path, () => "ok");
        }
        app.MapMethods("/api/items/{id:guid}", ["PUT", "NARTIN"], () => "ok");
        string output = Export(app);

        Assert.Equal(3, output.Split("reverse_proxy {args[0]}").Length - 1);
        Assert.Contains("method GET", output);
        Assert.Contains("method PUT", output);
        Assert.Contains("method NARTIN", output);
        Assert.Contains("path /api/items/*", output);
        Assert.Contains("@route2", output);
        Assert.DoesNotContain("@route3", output);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Missing_or_empty_method_metadata_uses_explicit_default_methods(bool emptyMetadata)
    {
        using var app = WebApplication.CreateBuilder().Build();
        var endpoint = app.Map("/api/any", (HttpContext _) => Task.CompletedTask);
        if (emptyMetadata)
        {
            endpoint.WithMetadata(new HttpMethodMetadata([]));
        }

        string output = Export(app);
        foreach (string method in new[] { "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "TRACE", "CONNECT" })
        {
            Assert.Contains($"method {method}\n", output.Replace("\r\n", "\n"));
        }
        Assert.DoesNotContain("method *", output);
        Assert.DoesNotContain("method NARTIN", output);
    }

    [Fact]
    public void Empty_path_argument_is_an_error_not_normal_server_startup()
    {
        using var app = WebApplication.CreateBuilder().Build();
        Assert.Throws<ArgumentException>(() =>
            CaddyAllowedRoutesExporter.TryExport(app, ["--generate-caddy-routes="]));
    }

    [Fact]
    public void No_routes_does_not_overwrite_an_existing_output_file()
    {
        using var app = WebApplication.CreateBuilder().Build();
        string path = Path.GetTempFileName();
        try
        {
            File.WriteAllText(path, "previous config");
            Assert.Throws<InvalidOperationException>(() =>
                CaddyAllowedRoutesExporter.TryExport(app, [$"--generate-caddy-routes={path}"]));
            Assert.Equal("previous config", File.ReadAllText(path));
        }
        finally
        {
            File.Delete(path);
        }
    }

    private static string Export(WebApplication app)
    {
        string path = Path.Combine(Path.GetTempPath(), $"routes={Guid.NewGuid()}.caddy");
        try
        {
            Assert.True(CaddyAllowedRoutesExporter.TryExport(app, [$"--generate-caddy-routes={path}"]));
            return File.ReadAllText(path);
        }
        finally
        {
            File.Delete(path);
        }
    }
}
