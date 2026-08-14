# ADR 0002: Selection Lanes

## Status

Accepted

## Context

DailyNagger shows a task tree. A nagger has a log, the log has task items, and
items can have entries or child items.

The first visual approach treated nested nodes as nested cards. That made the
tree easy to see at first, but it also created problems:

- every level added more boxes, borders, shadows, and background changes
- deeper nodes lost horizontal space
- the screen started to feel crowded and generic
- focus, selection, completion, and editability all competed for attention
- it became hard to see where add, move, or delete would apply

That was especially bad for DailyNagger because the app is supposed to reduce
mental load. The user should not have to remember the tree structure while
doing routine work.

## Decision

DailyNagger uses selection lanes to explain the task tree.

A selection lane is the visible vertical strip for a tree node. It shows where
the node lives, whether it is selected, and where commands will apply. We also
called these rails while designing them.

The lane carries the tree structure. Cards and rows carry content.

This means the UI should prefer:

- open surfaces over nested cards
- lanes over repeated boxes
- left-side growth for depth instead of shrinking content from both sides
- stable content width for labels and values
- one clear place to select the node itself

The lane is not decoration. It is the user's handle on the tree.

## Consequences

Nested task UI should not be rebuilt as cards inside cards unless there is a
new reason stronger than the problems above.

When simplifying the UI, do not remove a lane unless another equally clear
signal answers:

- where am I?
- what node will change?
- where will a new node be added?

Selection lanes should be large enough to use as touch targets, even when the
visible rail is slim. The hit area may be wider than the visible rail.

The plan screen can use lanes quietly because it is mostly for doing work. The
editor depends on lanes more strongly because move, delete, add, and edit
commands need a clear target.

Open surfaces are allowed to look calmer because the lane now carries the
structure. This is what let the UI move away from heavy nested boxes, dark
backgrounds, and repeated card chrome while keeping the tree understandable.
