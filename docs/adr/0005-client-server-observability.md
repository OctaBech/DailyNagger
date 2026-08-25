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

The client and server have different runtimes. We want the same observability
story across both, but that does not mean the same library has to run in both
places.

The tools fit different parts of the system:

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
  it is on the server. React Native is not a normal browser or Node.js runtime,
  so direct OpenTelemetry setup can involve extra wiring, native constraints,
  and more time spent on tooling than on learning the main observability flow.
  It may become useful later, but it is not the best first step for this app.

## Decision

DailyNagger will use a hybrid observability setup with clear tool ownership.

Sentry Cloud is the primary observability view for user-facing failures and
cross-system traces. It should be the place where we can open one user action
and see the timing bars, spans, errors, device context, user context, and API
request path in one view.

The mobile client will use Sentry for Expo/React Native.

The server will use OpenTelemetry/Sentry tracing for request and dependency
spans that must be visible in the same Sentry trace as the mobile action.

The server will use Serilog and Seq for structured server logs. Seq is the
server black box: it is for searchable operational logs, raw request logs,
startup logs, and production diagnosis when we need the detailed server side
record. Seq is not the primary UI for distributed trace timelines.

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

Server observability keeps two useful views instead of forcing one tool to do
everything. Sentry answers "what happened across the app, server, and later MCP?"
Seq answers "what did the server write while handling this?"

Server tracing can stay close to OpenTelemetry while still using Serilog for
practical structured logging.

The first useful traceability slice is one mobile API request that can be opened
in Sentry as a trace and matched with the same `requestId` in Seq.

Later MCP work should reuse the same request and trace context. MCP calls should
not become a separate invisible path through the system.

If Sentry, Serilog, or OpenTelemetry require setup code, that setup belongs near
the app/server boundaries. Feature code should not know which dashboard receives
the telemetry.
