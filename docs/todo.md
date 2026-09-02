# DailyNagger Todo

This file tracks project direction, current work, and parked ideas while
DailyNagger is still evolving.

## Product Work

- [x] Persist offline-first send queue in MMKV.
- [x] Coalesce queued updates for the same owner/key before sending.
- [x] Batch compatible queued updates before sending them to the server.
- [x] Surface send decisions for version conflicts, forced sends, discarded
      batches, and connection-loss retry.
- [x] Finish mood stamping on updated interaction nodes.
- [x] Wire mood selection to the server mood history endpoint.
- [x] Replace the queue and connection status badge idea with PostOfficeStrip
      visual sync/debug feedback.
- [ ] Add date grouping/separators to the nagger list.
- [ ] Add nag pinning for useful nags without due dates.
- [ ] Repair the visual presentation of pinned nags.
- [ ] Add item rename flow.
- [ ] Add notes to logs.
- [ ] Add value suggestions that show field type and useful previous values for
      task entry inputs.
- [ ] Add a few schedule rules only if they stay small: even/odd days and weeks.
- [ ] Clone nodes so useful task structures can be duplicated without rebuilding
      them manually.
- [ ] Add deleted-node restore as a simple safety net after accidental deletion.
- [ ] Add history/log browsing where previous logs and values help the current
      editing/logging flow.
- [ ] Add location support later for context-aware nags.

## UI And UX Polish

- [ ] Deduplicate plan/editor card theme so the editor stays WYSIWYG: same task
      tree visuals, with editing affordances layered on top instead of a
      separate color world.
- [ ] Tune SpeedDial color so the primary action reads clearly.
- [ ] Improve touch hit slop for small controls.
- [ ] Fix SpeedDial hints: they appear too quickly and do not disappear
      reliably.
- [ ] Hide or disable SpeedDial while startup/loading/blocking state screens are
      active.
- [ ] Replace rough SpeedDial action labels/icons with clear action-specific
      icons.
- [ ] Hide the mood bar after it has been set for a short period, so screenshots
      and daily use stay focused.
- [ ] Move MoodBar fully into the app-shell overlay so it stays globally visible
      without belonging to a single screen.
- [ ] Reduce tag height so tags align better with add step/note buttons.
- [ ] Make readonly text inputs non-selectable so display-only fields do not feel
      editable.
- [ ] Replace literal "New nagger" text with placeholder/suggestion text.
- [ ] Add ghost placeholder text for text, integer, and decimal task entry
      values.
- [ ] Let both NaggerField lines expand the nagger, but only the first line
      collapse it again.
- [ ] Let the second NaggerField line select the active TaskLog when the nagger
      is expanded.
- [ ] Keep the parent nagger border visible when a descendant TaskEntry is
      selected.
- [ ] Explore focus-depth viewport for deep trees: keep the current branch wide
      while keeping ancestors available as compact navigation.
- [ ] Add subtle optional motion after core flows are stable: modal depth,
      checkmark feedback, chevron settle, and mood reminder motion.
- [ ] Run an independent styling audit after the mobile UI settles.
- [ ] Clean up mobile accessibility intentionally: labels, roles, selected state,
      expanded state, touch targets, icon buttons, mood bar, speed dial, cards,
      checkboxes, modals, and state screens.
- [ ] Replace fixed SheetModal keyboard lift with measured `KeyboardLiftAnchor`.

## Quality And Tests

- [x] Push local commits and verify GitHub Actions status.
- [x] Keep generated server-owned API contracts consumed by mobile.
- [x] Add development identity guard in tree visitor so accidental id/ancestry
      changes fail loudly.
- [x] Make required tree reads and invalid branch operations throw explicit
      errors instead of silently returning stale or missing state.
- [x] Add SQL-backed server tests for core data read/write behavior.
- [x] Add API tests for versioned requests, validation, conflict handling, tags,
      mood, and task-log updates.
- [x] Add contract serialization tests for API request/response shapes.
- [x] Add observability tests for request-id middleware and request context.
- [ ] Add focused frontend/mobile tests now that CI can run them.
- [ ] Add focused tree-operation tests for replace, selection refresh, rollover
      pruning, progress counts, and stale-node cases.
- [ ] Learn frontend interaction testing with a small user-flow test around
      selecting, editing, and saving a task tree.
- [ ] Add focused server/API tests for sync conflicts, forced send, corrupt
      parcel handling, startup unavailable, rollover, progress counts, and DTO
      import.
- [ ] Remove test-convenience constructors from server request contracts. API
      request types should show the one JSON shape the client sends.
- [ ] After Git cleanup, run dead-code discovery with Knip and ts-prune. Use the
      results as review leads, not blind deletes.
- [ ] Add a persisted queue schema/version strategy so old incompatible parcels
      can be discarded intentionally during development.
- [ ] Make tree visitor identity changes opt-in: targeted visitors should throw
      when returned node ids change unless the operation explicitly allows
      identity replacement.

## CI/CD And Operations

- [x] CI validates contracts, server, mobile, formatting, and Docker/SQL tests.
- [x] Production deploy workflow.
- [x] Production smoke workflow.
- [x] Production backup workflow.
- [x] Rollback inspection workflow.
- [x] Manual mobile APK artifact workflow.
- [x] Dev environment stays reproducible through scripts.
- [x] Local Docker Compose starts SQL Server, Seq, database initialization, and
      the API container.
- [x] Production deploy backs up databases before deploying.
- [ ] Tune APK build cache in GitHub Actions.
- [ ] Decide whether APK artifacts need signing/version naming beyond the current
      manual debug-friendly artifact build.
- [ ] Add C# safety analyzers as a CI quality gate later.
- [ ] Add a commit-time formatter gate for the mobile project, likely
      Husky/lint-staged or the repo's chosen CI equivalent.
- [ ] Restore Visual Studio format-on-save settings so C# formatting stays
      boring locally.
- [ ] Tag deployment Docker images with an explicit version or git commit SHA
      instead of relying on `latest`.
- [ ] Add HTTPS, authentication, login, and user isolation before treating an
      external server as real daily-use infrastructure.
- [ ] Track Docker/VPS deployment in `docs/docker-vps-deploy-checklist.md`.
- [ ] Move connection/server config out of hardcoded settings so phone and VPS
      testing are realistic.
- [ ] Split fresh-machine setup from release building.
- [ ] Move Android SDK/NDK/CMake from `C:` to `E:` in a controlled migration.
- [ ] Clean stale PATH entries for uninstalled development tools.
- [ ] Clean up database migrations and schema once the data model is stable.

## Observability

- [x] Keep Sentry/Seq useful without leaking observability plumbing into feature
      code.
- [x] Record command, memory, startup, sending, rollover, and error-boundary
      events through observability boundaries.
- [x] Carry domain causality separately from technical Sentry trace IDs.
- [x] Add server-side causality reading so production logs and server spans can
      be connected to client parcels.
- [x] Require request IDs on API calls so logs, smoke checks, and traces can be
      correlated.

## Architecture

- [ ] Clean up actions/tree boundaries by moving old actions away from
      `tree-engine` so the code is easier to read and review.
- [ ] Add a minimal i18n boundary with `t(...)` and pseudo-locale marking, then
      delegate broad UI string extraction later.
- [x] Keep server-owned API DTOs generated into mobile TypeScript contracts.
- [x] Add model conversion that extends server DTOs with client tree properties
      on load and strips those properties before server sends.
- [x] Keep command dispatch behind a command boundary instead of wiring screens
      directly to memory, sending, and observability details.
- [x] Add tree visitor target facade so stale UI node tokens become validated
      traversal requests before tree changes are applied.
- [x] Carry required ancestry on tree targets so parent/task-log/nagger
      relationships are validated during traversal.
- [x] Add tree visitor index hints as a performance optimization without making
      correctness depend on cached indexes.
- [ ] Migrate API tree contracts to a recursive discriminated union with one
      shared `children` array for mixed task items and entries, as described in
      ADR 0012. Defer the migration until it can be done deliberately across
      server DTO ownership, OpenAPI generation, model conversion, and mobile tree
      operations.
- [ ] Split large server files into clearer boundaries later.
- [ ] Add a central mobile `apiFetch` boundary for auth, base URL, JSON, timeout,
      and network diagnostics.
- [ ] Remove the old notifications service and let connection feedback flow
      through sending events/snackbar.
- [ ] Decide where shared theme colors and styling primitives should live.
- [ ] Clean up central style tokens for colors, spacing, radius, font sizes,
      z-index/elevation, safe-area constants, and animation timing.
- [ ] Move component styling ownership into components, so callers pass semantic
      props or color tokens instead of raw style wiring.
- [ ] Measure render performance before adding broad `useCallback`/`useMemo`
      noise.
- [ ] Investigate first-mount render spikes on emoji-heavy cards only if it
      becomes visible on device.
- [ ] Clean up runtime warnings: require cycles, deprecated `pointerEvents`, and
      any remaining platform warnings during Expo startup.
- [ ] Add profiling tooling such as React DevTools Profiler.
- [ ] Learn and introduce animation primitives for visual-only motion, starting
      with React Native `Animated`.
- [ ] Use React Query for server-owned metadata such as tags, picklists, history
      lookups, and later MCP helper previews.
- [ ] Add dev preview routes for state screens, queue badges, mood UI, and future
      MCP questions.
- [ ] Consolidate old documentation into the main architecture document and
      rename it when it no longer describes only the client.
- [ ] Establish one DTO contract owner if the current generated-contract setup
      stops being enough.

## Documentation And Presentation

- [x] Tighten root `README.md` into a short repo front page.
- [ ] Add or tighten local READMEs only where they help a reviewer understand a
      boundary: command boundary, sending/offline queue, tree operations, and
      server write flow.
- [ ] Add a small server write-flow diagram that shows optimistic client write,
      persisted queue, server transaction, version conflict, and retry/decision
      paths.
- [ ] Add a one-page DailyNagger case note for CV/job applications with
      screenshots and 2-3 code references.
- [ ] Do a public-reader pass before sharing GitHub access: remove stale notes,
      confusing leftovers, and TODOs that look like broken production behavior
      instead of planned work.

## Half-Finished Features

- [ ] Finish and verify the full mood stamping update path.
- [ ] Finish final client send/startup wiring for user mood.
- [ ] Show device identity in conflict UI in a human-friendly way.
- [ ] Finish undo/redo command/history flow.
- [ ] Finish tags for task/log/node tagging once model, UI, and send-flow
      decisions are settled.

## Learning Tracks

- [ ] Learn server observability for interviews and real operations: structured
      request/error logging, correlation/causality IDs, tracing basics, and how
      to read logs when production rejects a client parcel.
- [ ] Build a tiny SSR/RSC learning project, separate from DailyNagger, to
      practice server/client boundaries without dragging the mobile app into it.

## MCP And LLMX

- [ ] Build MCP context shaping endpoints that expose LLM-friendly context
      instead of raw DB rows or editable app trees.
- [ ] Add SignalR space for live MCP questions and suggestions.
- [ ] Let MCP ask 2-3 choice questions that the user approves in the client.
- [ ] Let MCP suggest or request pinning nags, but keep actions human-approved.
- [ ] Shape context by mode: nudge, decision, recovery, and history.
- [ ] Keep latency visible in context design: fast nudges need tiny shaped
      context, while slow summaries can run in the background.
- [ ] Add stored LLM memory summaries later so the hot path does not resend the
      user's whole history.
- [ ] Define privacy and consent rules for mood, location, community data, and
      MCP-suggested actions.
- [ ] Explore opt-in community context later, where MCP can reason over nearby
      or shared-goal situations without exposing raw private data.
