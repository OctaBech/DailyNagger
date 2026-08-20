# ADR 0005: Client And Server Observability

## Status

Accepted

## Context

DailyNagger is moving toward MCP and assistant-driven workflows.

That means a single user action may eventually travel through the mobile app,
the server, an MCP layer, and an LLM provider. When something fails, we need to
see the path the action took. Guessing from screenshots and generic 500 errors
is not good enough.

We also want this work to teach real observability practices. The goal is not
only to see more logs. The goal is to learn the tools, vocabulary, and tradeoffs
that are common in production systems: structured logs, breadcrumbs, request
context, trace ids, correlation ids, spans, and exporters.

The client and server have different strengths:

- Expo React Native has mature Sentry support. Sentry is widely used for mobile
  apps, has an active ecosystem, and is good at the things a mobile client needs:
  crashes, JavaScript errors, breadcrumbs, device context, release information,
  and source maps.
- .NET servers are a strong fit for Serilog. Serilog is widely used in .NET,
  has a long-lived community, and makes structured logs practical without
  turning every log line into string formatting.
- OpenTelemetry is the standard direction for traces and telemetry pipelines.
  It is strongest on the server side, where HTTP middleware, exporters, and
  collectors are well supported.
- OpenTelemetry directly inside React Native is still less straightforward than
  it is on the server. It may become useful later, but it is not the best first
  step for this app.

## Decision

DailyNagger will use a hybrid observability setup.

The mobile client will use Sentry for Expo/React Native.

The server will use Serilog and OpenTelemetry.

Client API calls should carry correlation data to the server. At minimum, the
client should create a request id for each API call and send it in a header. The
server should log that id and include it in the request context.

When distributed tracing is added, the client and server should use standard
trace context headers where possible instead of inventing a DailyNagger-only
trace format.

Small wrappers around Sentry, Serilog, or OpenTelemetry are allowed when they
keep DailyNagger code tidy. Those wrappers should adapt the chosen tools to the
app's boundaries. They should not become a separate observability product inside
DailyNagger.

## Consequences

Client observability starts with a tool that is already strong in Expo and React
Native projects.

Server observability can stay vendor-neutral through OpenTelemetry while still
using Serilog for practical structured logging.

The first useful traceability slice is not dashboards. It is being able to match
one client API request with the server logs that handled it.

Later MCP work should reuse the same request and trace context. MCP calls should
not become a separate invisible path through the system.

If Sentry, Serilog, or OpenTelemetry require setup code, that setup belongs near
the app/server boundaries. Feature code should not know which dashboard receives
the telemetry.
