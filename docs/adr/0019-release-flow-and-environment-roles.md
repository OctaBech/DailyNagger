# ADR 0019: Release Flow And Environment Roles

## Status

Accepted.

## Context

DailyNagger is a personal Android app without login. DailyNaggerDemo uses the
same API but a separate community and a disposable copy of production data.
The demo database is a sandbox for trying the app, not a parallel server
staging environment.

CI must check changes before merge. CD must build candidates from the checked
commit, without rebuilding them during publication. A server release must
preserve production data and recover automatically if migration or pre-release
checks fail. The API is the only permitted writer during this release window.

## Decision

```text
Pull request
  -> relevant CI checks and required merge gate
  -> merge to main
  -> CD builds relevant candidates from that commit:
       server image, DailyNagger APK, DailyNaggerDemo APK
  -> verify the candidates and their common commit
  -> one publication approval
  -> if a server image was built, publish the server
  -> if APKs were built and the server path succeeded, publish DailyNaggerDemo
```

`main` requires a pull request and a green `CI 3 · Merge gate` before merge.
CI selects checks from the changed files. The server check tests application
code; the independent deployment check tests Compose, Caddy, deployment
scripts, backup/restore against disposable SQL databases, and the deployment
archive. The gate fails if any selected check fails and accepts a skipped check
only when it was not selected. A failed deployment change cannot enter `main`,
so unrelated commits need not rerun unchanged deployment checks. CD starts
only after a successful CI run on `main` and uses that run's commit; it does
not search for or re-evaluate older check results.

Caddy is the public reverse proxy in front of the DailyNagger API:
`phone -> Caddy -> API -> SQL Server`. Normally it forwards requests to
the API. During server publication, Caddy instead returns HTTP 503 directly,
so new public requests cannot reach the API. SQL Server stays running.

Server publication runs as one protected job, with these visible steps:

```text
Switch Caddy to a persistent maintenance configuration that returns HTTP 503
  -> stop the old API and wait for it to stop
  -> keep SQL Server and its persistent volume running
  -> back up and verify DailyNaggerData, DailyNaggerControl, and the separate demo data database
  -> record the currently deployed server image
  -> apply migrations from the candidate commit to both data databases and the control database
  -> start the already-built server image
  -> run read-only smoke checks directly on the internal Docker network
  -> success: restore Caddy's normal proxy configuration and reopen traffic
  -> backup failure: restart the previous image without restoring the database
  -> later failure: restore all three backups and restart the previous image
  -> after successful recovery: restore normal proxying and reopen traffic
```

The API must remain unavailable for writes from before the backups until the
success-or-rollback decision. No other process may write to either database
during this interval. This is what makes automatic database restoration safe:
there can be no new writes for a restore to discard. The verified backups
must be retained before any migration begins. A failed migration is detected
from its exit status; a failed migration or smoke check triggers the same
rollback path. Rollback failure keeps the API closed and fails the job loudly
rather than exposing an unknown database state.

Caddy reloads its configuration without restarting its container. The
maintenance setting must also survive a Caddy restart; a restart must not
silently reopen public access while the publish job is still running. Smoke
checks bypass Caddy's public route and must not write to the databases.
The active Caddy configuration is stored outside the source archive, so
copying a new release cannot replace maintenance mode with normal routing.

The server image and migration source must correspond to the same checked
commit. Changing the server image never removes or replaces the SQL Server
volume. Database backups are retained outside that volume. If migration
changes require special handling, that work must be resolved before approval;
the publish job does not guess how to recover after traffic has reopened.

For a server-only candidate, no APK is built or published. For a mobile-only
candidate, the same single approval is required, server steps are skipped, and
the existing DailyNaggerDemo APK is published. For a combined candidate,
DailyNaggerDemo is published only after successful server publication. The
personal DailyNagger APK is never uploaded as a plain artifact: CD encrypts
it as an AES-256 ZIP before artifact upload and publishes that ZIP alongside
the demo APK. Its password is not included in the release. This protects APK
distribution; it is not a substitute for server-side authentication.

DailyNaggerDemo uses its own community database through the production API.
That database must be compatible and smoke-checked before the demo APK is made
public. Any database changed by the migration, including the demo database if
applicable, must have a matching backup and rollback path before publication.
Refreshing demo data never overwrites production data or routing.

## Consequences

- One approval covers the applicable publish path; server backup, migration,
  startup, smoke checks, and rollback remain in one protected job.
- Publication uses the exact server image and APKs produced by CD; it does not
  rebuild them.
- Production writes pause during server publication. A failed pre-release
  attempt restores all three databases and the previous server automatically.
- There is no automatic database restore after the API has reopened, because
  new writes may then exist. A later failure needs a separate recovery decision.
