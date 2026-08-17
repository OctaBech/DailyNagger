# App Shell

This folder owns app-level UI, not feature UI.

`AppShell` is the outer layer around the screens. It is the right place for
things that should feel global, stay visible across screens, or sit outside a
single feature's ownership.

## What Belongs Here

- App background and safe-area behavior.
- System bar color ownership through one shared boundary.
- Global overlays such as MoodBar, PostOfficeStrip, assistant bubbles, and
  future snackbars/toasts.
- App-level error boundaries and blocking startup/loading states.

## Surface Ownership

AppShell owns the app background and global overlays.

Screens own their content surface.

Cards, modals, and controls own their local surfaces.

System bars should follow the app/screen theme through one boundary, not
through one-off styling in individual screens.

## What Does Not Belong Here

Do not turn AppShell into a general communication bus.

Feature components should not use AppShell to talk to each other. Prefer props
for local UI, screen commands for user intent, and service actions for task-tree
changes.

If a concern only matters inside one feature, keep it out of AppShell.
