# ADR 0017: API Error Scrubbing

## Status

Accepted

## Context

API calls can fail with response bodies, URLs, request ids, and timing data.
Those errors may later be shown in logs, Sentry, or developer tooling.

The API boundary should make failed request messages useful without letting raw
server responses or full URLs leak into error text.

## Decision

API request errors are scrubbed inside the API boundary before they can be
recorded by observability.

`sanitizeApiErrorUrl(...)` removes query strings from URLs before they are used
in error messages. The origin and path are kept because they are useful for
finding the failing endpoint.

`sanitizeApiErrorBody(...)` trims the response body and truncates long bodies.
This keeps errors readable and avoids sending large or sensitive response text
through logs and Sentry.

Scrubbing belongs to the API request error construction, not to Sentry. That
means it also works for API calls that do not pass observability context, such
as React Query calls.

## Consequences

All API errors get the same baseline protection:

- useful method, path, status, request id, and duration information
- no query string in the error URL
- bounded response body length

Observability may still add spans, breadcrumbs, and causality metadata around an
API request, but it should not be responsible for making raw API errors safe.
