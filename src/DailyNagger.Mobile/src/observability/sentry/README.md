# Sentry Observability Toolbox

This folder contains small Sentry-specific helpers.

The rest of `observability/` may understand DailyNagger events. This folder should only understand Sentry concepts such as breadcrumbs, spans, attributes, and span continuation.

Planned toolbox shape:

- `recordBreadcrumb` records one breadcrumb on the current Sentry scope.
- `recordSpanValue` records one attribute on the active span when a span exists.
- `startNewSpan` will start a new span around an execution.
- `packSpan` will turn an active span into persisted continuation data.
- `reactivateSpan` will continue persisted span context around later execution.
