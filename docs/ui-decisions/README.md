# UI Decisions

This folder is the front door for UI and product interaction decisions.

Use it when changing the plan screen, editor, cards, selection lanes, speed-dial,
or other interaction patterns. The goal is not to document every pixel. The goal
is to keep the reasoning visible, so we do not rediscover the same tradeoffs
after the code has moved on.

## Start Here

- [ADR 0001: Current Direction](../adr/0001-current-direction.md)
- [ADR 0002: Selection Lanes](../adr/0002-selection-lanes.md)

## Plan Screen And Editor

The plan screen is for doing the work.

The editor is for changing the shape of the work.

That split matters because DailyNagger is supposed to reduce mental load. When
the user opens the plan screen, they should be able to see what matters now,
check things off, enter values, add a simple note or item to the current log,
and leave again.

If the plan screen starts offering move, delete, deep child creation, schedule
rules, value type setup, and rollover behavior everywhere, the app stops helping
the user act. It turns the user into a project manager for their own day.

So the current rule is:

- plan screen: execute tasks, enter values, expand what is needed, add simple
  log-root items or notes
- editor: move nodes, delete nodes, build nested structure, change schedules,
  change value types, and change rollover behavior

This keeps the plan screen beginner-friendly and predictable. It also lets the
editor be explicit, because the user went there to change structure.

If a future action needs an explanation before the user can predict where it
applies, it probably belongs in the editor.

## Selection Lanes

Selection lanes, also called rails in conversation, are the visible "you are
here" surface for tree nodes.

See [ADR 0002: Selection Lanes](../adr/0002-selection-lanes.md) for the product
decision behind this interaction model.

They exist because rows can contain several editable things: title, label, tag,
value, checkbox, and expand/collapse. The user still needs one reliable place to
select the node itself without accidentally editing text or changing a value.
The user should not have to keep the task tree in their head.

The lane should make these questions obvious:

- what node is selected
- what part of the tree the user is working inside
- what will change if the user presses the current command
- where a new node would be added

This matters most in the editor, where add, move, delete, and edit commands must
have a clear target. The plan screen can use lanes more quietly, but it still
needs the same honesty: if the UI lets the user add something locally, the user
must be able to see where that thing will land.

The lane is not decoration. It is cognitive infrastructure.

Do not remove, hide, or soften lanes just to make the UI cleaner unless another
equally clear signal answers:

- where am I?
- what will change?
- where will the new thing be added?

If a lane is visually broken, too hard to hit, or disconnected from its node, the
user has to infer the tree structure. That is a bug against DailyNagger's main
purpose.

## How To Add A UI Decision

Use an ADR when the decision changes what the app is allowed to do.

Use a local README near the code when the decision is about how to work safely
inside that folder.

Write in plain language:

- what problem we ran into
- what we decided
- what future code should do
- what future code should avoid

DailyNagger should help the user act. The docs should do the same for the next
developer.
