# Generated Caddy endpoint allowlist

## Ownership and limits

ASP.NET endpoint registration is the source of truth. The existing server
executable can export route blocks and exit without opening a listening socket:

```sh
dotnet DailyNagger.Server.dll --generate-caddy-routes=/export/routes.caddy
```

Run with `ASPNETCORE_ENVIRONMENT=Production` (and without development launch
profiles), so development-only OpenAPI endpoints are not exported.

The export preserves HTTP methods and replaces `{...}` route parameters with
Caddy `*`. This is intentionally **coarse filtering**, not a reimplementation of
ASP.NET routing. A wildcard can span multiple segments and does not validate
GUIDs or integers. Optional parameters, route-template regexes containing
braces, and case/trailing-slash variations are not guaranteed equivalent by
this simple replacement. When introducing such routes, extend the routing
integration test before relying on them through the proxy.

Endpoints without method restrictions use the explicit `DefaultHttpMethods`
policy. This is not every conceivable HTTP method; custom methods must be
registered explicitly. CORS preflight handled by middleware rather than an
endpoint is not automatically exported; review OPTIONS behavior before adding
browser clients. Current mobile clients do not need CORS preflight.

Unknown paths and unsupported method/path combinations receive Caddy's 404
without reaching ASP.NET. An allowed path can still return an application 404
or 401. This is not authentication, rate limiting, IP banning, or DDoS protection.

## Build, publish, and rollback

`deploy/build-caddy-routes.sh IMAGE OUTPUT` runs the exact server image offline,
then combines its snippet with `deploy/Caddyfile.routes`. The result is one
self-contained Caddyfile: the snippet receives `server:8080` through an import
argument, and the final catch-all responds with 404.

CI validates this file with Caddy 2.10 and exercises it against the actual server
image on an isolated Docker network. Allowed requests are confirmed in server
logs; scanner paths and wrong HTTP methods must not appear there. SQL databases
are unnecessary for this test: protected routes are called without credentials.

During release preparation, the publisher:

1. Saves the current normal routing alongside the previous image identity.
2. Exports the candidate image's routes and validates the candidate Caddyfile
   through the proxy's existing read-only mount, without activating it.
3. Keeps public traffic in maintenance during backup, migration, startup, and smoke.
4. Atomically installs `caddy-state/normal.Caddyfile`, then reloads normal routing.

The legacy `deploy/Caddyfile` remains unchanged as the initial fallback. The
versioned publisher uses its own `set-caddy-mode.sh` and prerequisite script, so
old VPS helper scripts cannot silently bypass the generated routing during a
release. For manual mode changes after adoption, use the **current release's**
`set-caddy-mode.sh`, not an older copy left on the VPS.

Before traffic opens, rollback restores both the previous image/database state
and the saved normal routing (including the first transition from legacy
routing). After opening begins, automatic database restoration remains forbidden;
the existing failure policy closes traffic for manual inspection.

No production activation is required just to merge this feature. It takes effect
only when the normal production-approval release process runs.

## Before/after live probes

Use a fresh `dn.api.request_id` UUID and a recognizable query marker for each
request. Compare these harmless GET paths before and after activation:

- `/api/health` (must still reach the API)
- `/`
- `/wordpress/wp-json/`
- `/admin/settings`
- `/auth/login`
- `/api/sherlock-unknown`

Confirm the allowed control request in ASP.NET logs/Seq. Rejected requests must
not reach ASP.NET. Absence from Sentry alone is not proof, because tracing can
be sampled. Before activation the unknown `/api/...` probe may return 401 from
authentication; after activation it should receive Caddy's 404.
