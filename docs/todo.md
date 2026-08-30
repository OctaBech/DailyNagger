# DailyNagger Todo

This file tracks near-term work that should not be lost while the architecture is still settling.

## Top Tracks

- [ ] Push local commits and verify GitHub Actions status.
- [ ] CI: keep validation trustworthy for contracts, server, mobile, formatting, and Docker/SQL tests.
- [ ] CD: keep backup, deploy, smoke, and rollback procedures clear before more automation.
- [ ] Observability: keep Sentry/Seq useful without leaking observability plumbing into feature code.
- [ ] DTO contracts: keep server-owned contracts generated and consumed by mobile.
- [ ] Dev environment: keep Windows/E-drive setup reproducible through scripts.
- [ ] Frontend tests: add focused tests once the current pipeline is stable.
- [ ] Actions/tree cleanup: move old actions away from `tree-engine`.
- [ ] Server structure: split large server files into clearer boundaries.

## Current Priority

- [ ] Review the 13 local commits ahead of `origin/main`, push them, and confirm CI.
- [ ] Update ADR 0011 so `recordXxx(...)` explicitly owns span/breadcrumb lifecycle and returns next observability when needed.
- [x] Add sending request spans that use persisted parcel observability.
- [ ] Add sending flush spans if request spans do not explain batching clearly enough.
- [ ] Add C# safety analyzers that remind us when disposable objects are not cleaned up. Keep the tool names in docs only where helpful: `CA2000` / `IDisposableAnalyzers`.
- [ ] Define a build/test matrix for the repo before CI/CD: `DailyNagger.Mobile` and `DailyNagger.Server` are separate build/test units in the same repo. Mobile-only changes need mobile typecheck/lint/build; server-only changes need server build/tests; contract/API changes need both sides to compile and preferably a smoke test. If SQL Server is unavailable, say that explicitly instead of pretending server tests passed.
- [ ] Teach Martin proper server observability for job interviews and real operations: set up Serilog, structured request/error logging, correlation/trace IDs, tracing basics, and how to read the logs when production rejects a client parcel. Goal: no more silent server failures and no scattered endpoint logging hacks.
- [ ] Remove test-convenience constructors from server request contracts. API request types must show the one JSON shape the client sends; tests should build that shape directly or use test-only helpers.
- [ ] Deduplicate plan/editor card theme so the editor stays WYSIWYG: same task tree visuals, with editing affordances layered on top instead of a separate color world.
- [ ] Delegate i18n extraction to MCP later: move visible UI strings behind a small `t(...)` boundary, add a pseudo-locale/debug mode that marks translated strings visually, and keep model/API enum values unchanged.
- [ ] Prepare Git cleanup so we can diff, rollback, and review changes in small safe slices.
- [ ] After Git cleanup, run dead-code discovery with Knip and ts-prune. Use the results as review leads, not blind deletes.
- [ ] Add a central mobile `apiFetch` boundary for auth, base URL, JSON, timeout, and network diagnostics. Cross-cutting concerns belong in boundaries.
- [x] Finish mood stamping on updated interaction nodes.
- [x] Wire mood selection to the server mood history endpoint.
- [x] Replace the queue and connection status badge idea with PostOfficeStrip visual sync/debug feedback.
- [ ] Add nag pinning for useful nags without due dates.

## Half-Finished Features

- Mood stamping exists in parts of the model/send flow, but the full update path still needs to be finished and verified.
- User mood has a server endpoint, but the client still needs final send/startup wiring.
- Device identity is stamped on sends and stored by the server, but conflict UI does not yet show the device in a human-friendly way.
- Undo/redo has enough editor structure to become practical, but the actual command/history flow is not finished.
- Tags exist as server-owned metadata, but task/log/node tagging still needs model, UI, and send flow decisions.

## Product Features To Add

- Queue status badge: show pending parcel count and connection state in the top-right area.
- Pinning: allow important nags without due dates to stay visible, especially for MCP suggestions.
- i18n structure: centralize user-facing strings without over-engineering reusable text.
- Worker task: audit and implement accessibility after the UI language settles. Cover labels, roles, selected/expanded state, touch targets, mood bar, speed dial, cards, checkboxes, modal controls, and state screens.
- Mobile UI polish: tune spacing, touch ergonomics, speed dial layout, and mood bar behavior on a real phone.
- Move MoodBar fully into the app-shell overlay so it stays globally visible without belonging to a single screen.
- Polish SpeedDial icons so available actions are easier to recognize at a glance.
- Clone nodes: duplicate useful task structures without rebuilding them manually.
- Deleted node restore: give the editor a simple safety net after accidental deletion.
- Value suggestions: show field type and useful previous values for task entry inputs.
- Location support: GPS tracking and map-based location selection for context-aware nags.
- History/log browsing: expose previous logs and values where they help the current editing/logging flow.

## UX Polish

- Add emotional-design polish after core flows are stable. Treat these as small one-day side quests alongside MCP work, not blockers:
  - Modal open: background content subtly scales down while dimming, so the sheet feels like it comes forward.
  - Checkmark toggle: quick expand/retract bounce, satisfying but short.
  - Chevron expand/collapse: small rotate/settle motion.
  - Mood bar: occasional gentle wave as a reminder, not constant attention grabbing.
  - Keep all motion subtle and optional so DailyNagger stays an in-and-out app.
- Run an independent styling audit after the mobile UI settles. Check spacing ownership, touch targets, card density, modal layout, safe-area behavior, typography scale, color contrast, selected-state chrome, and whether component boundaries match the visual design rules.
- Clean up mobile accessibility intentionally. Add consistent `accessibilityLabel`, `accessibilityRole`, and state hints for icon-only controls, mood buttons, speed dial actions, checkbox controls, modal close buttons, selected cards, and state screens. Keep labels user-facing and action-based, not component-name based.
- Replace fixed SheetModal keyboard lift with measured `KeyboardLiftAnchor`. The active input should select an anchor, `SheetModal` should measure that anchor against the keyboard top, and the sheet should lift only enough to keep the relevant workflow region visible. This makes keyboard avoidance intent-aware: tag-name focus keeps input, sorting, and tag suggestions visible; description focus keeps description and the relevant content above it visible; footer actions are not keyboard-critical.
- Remove the old notifications service and let connection feedback flow through sending events/snackbar.
- Move MoodBar ownership out of plan screen wiring and into app-shell wiring.
- Hide or disable SpeedDial while startup/loading/blocking state screens are active.
- Replace rough SpeedDial action labels/icons with clear action-specific icons.
- Add calm date separators between nagger groups. Bad boys respect nagger date boundaries.
- Explore focus-depth viewport for deep trees: keep the current branch wide by shifting older ancestors left, keep compressed ancestor lanes visible as breadcrumb-like navigation, and avoid a separate drill-down screen unless the tree truly forces it.
- Make readonly text inputs non-selectable so display-only fields do not feel editable.
- Let both NaggerField lines expand the nagger, but only the first line collapse it again.
- Let the second NaggerField line select the active TaskLog when the nagger is expanded.
- Keep the parent nagger border visible when a descendant TaskEntry is selected.
- Replace literal "New nagger" text with placeholder/suggestion text.
- Add ghost placeholder text for text, integer, and decimal task entry values.

## Architecture And Infrastructure

- Split fresh-machine setup from release building. `bootstrap-dev.ps1` should own
  tool checks, cache locations, restore/install steps, and guided setup for
  missing system tools. `build-mobile-release-apk.ps1` should stay focused on
  building and installing a release APK from an already prepared machine. Keep
  build-tool compatibility shims in the build script only when they are required
  to make the current dependency graph build reliably.
- Move Android SDK/NDK/CMake from `C:` to `E:` in a controlled migration.
- Clean stale PATH entries for uninstalled development tools.
- Build a tiny SSR/RSC learning project, separate from DailyNagger, to practice server/client boundaries without dragging the mobile app into it.
- Move connection/server config out of hardcoded settings so phone and VPS testing are realistic.
- Deploy a real server target so the phone can use DailyNagger outside localhost.
- Tag deployment Docker images with an explicit version or git commit SHA instead of relying on `latest`.
- Add HTTPS, authentication, login, and user isolation before treating an external server as real daily-use infrastructure.
- Track Docker/VPS deployment in `docs/docker-vps-deploy-checklist.md`.
- Decide where shared theme colors and styling primitives should live.
- Clean up central style tokens for colors, spacing, radius, font sizes, z-index/elevation, safe-area constants, and animation timing.
- Move component styling ownership into components, so callers pass semantic props or color tokens instead of raw style wiring.
- Measure render performance before adding broad `useCallback`/`useMemo` noise.
- Low priority: investigate first-mount render spikes on emoji-heavy cards. Current suspicion is text/font measurement or `CommitTextInput` mount behavior on web/dev; only optimize if it becomes visible on device.
- Clean up runtime warnings: require cycles through app-shell/components, deprecated `pointerEvents` prop usage, and any remaining platform deprecation warnings that show during Expo startup.
- Add profiling tooling such as React DevTools Profiler or why-did-you-render.
- Learn and introduce animation primitives for visual-only motion, starting with React Native `Animated` and considering Reanimated later if needed.
- Use React Query for server-owned metadata such as tags, picklists, history lookups, and later MCP helper previews.
- Add a persisted queue schema/version strategy so old incompatible parcels can be discarded intentionally during development.
- Add dev preview routes for state screens, queue badges, mood UI, and future MCP questions.
- Consolidate old documentation into the main architecture document and rename it when it no longer describes only the client.
- Clean up database migrations and schema once the data model is stable.
- Add focused tests before publishing the repo: sync conflicts, forced send, discard corrupt parcel, startup unavailable, rollover, progress counts, and DTO import.
- Establish one DTO contract owner. The server should own the API DTO contract, and the mobile client should import or generate its TypeScript DTO types from that contract instead of manually maintaining a second shape.
- Prepare the public Git foundation after the architecture is stable enough for feature-sized commits.
- Learn CI/CD with Git and Docker, using DailyNagger as the real deployment pipeline example.
- Add a commit-time formatter gate for the mobile project, likely Husky/lint-staged or the repo's chosen CI/CD equivalent, so Prettier runs automatically before commits and formatting noise stops stealing focus.
- Learn frontend interaction testing with a small user-flow test around selecting, editing, and saving a task tree.
- Add focused tree-operation tests for replace, selection refresh, rollover pruning, progress counts, and stale-node cases.
- Make tree visitor identity changes opt-in: targeted visitors should throw when returned node ids change unless the operation explicitly allows identity replacement.

## MCP And LLMX

- Build MCP context shaping endpoints that expose LLM-friendly context instead of raw DB rows or editable app trees.
- Add SignalR space for live MCP questions and suggestions.
- Let MCP ask 2-3 choice questions that the user approves in the client.
- Let MCP suggest or request pinning nags, but keep actions human-approved.
- Shape context by mode: nudge, decision, recovery, and history.
- Keep latency visible in context design: fast nudges need tiny shaped context, while slow summaries can run in the background.
- Add stored LLM memory summaries later so the hot path does not resend the user's whole history.
- Define privacy and consent rules for mood, location, community data, and MCP-suggested actions.
- Explore opt-in community context later, where MCP can reason over nearby or shared-goal situations without exposing raw private data.
