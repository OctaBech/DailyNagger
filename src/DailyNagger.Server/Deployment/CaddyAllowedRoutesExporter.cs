using System.Text.RegularExpressions;

namespace DailyNagger.Server.Deployment;

public static class CaddyAllowedRoutesExporter
{
    private const string GenerateCaddyRoutesArg = "--generate-caddy-routes=";
    // Intentional proxy policy: unrestricted endpoints get these standard
    // methods; custom methods must be registered explicitly on the endpoint.
    private static readonly string[] DefaultHttpMethods =
    [
        HttpMethods.Get,
        HttpMethods.Head,
        HttpMethods.Post,
        HttpMethods.Put,
        HttpMethods.Patch,
        HttpMethods.Delete,
        HttpMethods.Options,
        HttpMethods.Trace,
        HttpMethods.Connect
    ];

    public static bool TryExport(WebApplication app, string[] args)
    {
        string? outputPath = GetOutputPath(args);
        if (string.IsNullOrEmpty(outputPath)) return false;

        var routes = GetRouteEndpoints(app)
            .SelectMany(endpoint => GetHttpMethods(endpoint),
                (endpoint, method) => (
                    Method: method,
                    Path: endpoint.RoutePattern.RawText
                ))
            .Distinct()
            .Select((route, index) => FormatRouteString(route, index))
            .ToArray();

        if (routes.Length == 0) throw new InvalidOperationException("No routes found to export.");

        File.WriteAllLines(outputPath, routes);

        return true;
    }

    private static IEnumerable<string> GetHttpMethods(RouteEndpoint endpoint)
    {
        var methods = endpoint.Metadata
            .GetMetadata<IHttpMethodMetadata>()?
            .HttpMethods;

        if (methods is null || methods.Count == 0)
        {
            return DefaultHttpMethods;
        }

        return methods;
    }

    private static string FormatRouteString((string Method, string? Path) route, int index)
    {
        if (string.IsNullOrWhiteSpace(route.Path))
        {
            throw new InvalidOperationException(
                $"Route with method {route.Method} has no path.");
        }

        // Coarse filtering only: ASP.NET still owns parameter constraints.
        string caddyPath = Regex.Replace(route.Path, @"\{[^{}]+\}", "*");

        return $$"""
            @route{{index}} {
                method {{route.Method}}
                path {{caddyPath}}
            }
            handle @route{{index}} {
                reverse_proxy {args[0]}
            }
            """;
    }

    private static string? GetOutputPath(string[] args)
    {
        string? argument = args.FirstOrDefault(
            arg => arg.StartsWith(GenerateCaddyRoutesArg, StringComparison.Ordinal));

        if (argument is null) return null;

        string outputPath = argument.Split('=', 2)[1];

        if (string.IsNullOrWhiteSpace(outputPath))
        {
            throw new ArgumentException("Expected an output path.");
        }

        return outputPath;
    }

    private static IEnumerable<RouteEndpoint> GetRouteEndpoints(WebApplication app)
    {
        IEndpointRouteBuilder routeBuilder = app;

        return routeBuilder.DataSources
            .SelectMany(source => source.Endpoints)
            .OfType<RouteEndpoint>();
    }
}
