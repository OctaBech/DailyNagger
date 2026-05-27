# Product Spec

## Goal

Build a mobile todo app that helps users remember recurring real-life tasks by combining nested checklists, reusable old entries, scheduling, and context-aware nagging.

## Core Concepts

### Task

A task is the main item the user wants to remember.

Examples:

- Go to the gym
- Buy groceries
- Pay rent
- Call dentist

A task can have subtasks.

A top-level task belongs to a task series. The series owns meta behavior such as recurrence, reminders, nag rules, and home-surface behavior. Child tasks inherit that series behavior and should not redefine it independently.

Tasks can optionally have an icon to make them easier to identify at a glance. Icons are especially useful for pinned home buttons, nearby tasks, and recurring routines.

Recommended icon sources:

- Built-in searchable icon library for common categories.
- Emoji picker for fast personal symbols.
- Custom image later, if the user wants photos or personal artwork.

The MVP should start with a built-in icon picker and optional emoji fallback. Custom images can wait until the core task flow works.

The app should not depend on a live icon API for normal task icons. A bundled open-source icon set is faster, works offline, avoids API pricing surprises, and keeps icon licensing easier to audit.

External image services can be useful later for user-uploaded custom images because they can resize, crop, optimize, and cache images automatically.

### Subtask

A subtask is an item inside a parent task.

Examples under "Go to the gym":

- Squats
- Bench press
- Stretching

Examples under "Buy groceries":

- Milk
- Eggs
- Coffee

### Suggestion

Every task and subtask title can become reusable suggestion history. When the user starts typing, the app filters previous titles and lets them tap to insert one.

Suggestion behavior:

- Match from the start of words.
- Prefer recent and frequently used items.
- On the home screen, suggest old top-level task titles.
- Inside a task, suggest old subtask titles previously used under that same parent task.
- Provide a wide suggestion toggle inside a task to include old items from other tasks.
- Keep task suggestions and subtask suggestions separate, but allow wide search when the user asks for it.
- Task item reuse should default to narrow search.
- Do not suggest completed one-off tasks forever unless reused.

### Recurrence

Each task series can have one recurrence rule:

- None
- Weekly
- Monthly
- Yearly
- Specific date
- Custom interval, such as every 3 days or every 2 weeks
- Rotating schedule, such as Push-Pull-Legs or a bi-weekly/tri-weekly program

Each recurring task should generate the next due occurrence after completion or dismissal.

Recurring parent tasks should repeat by copying the latest previous instance. If a subtask is added to a recurring task such as "Gym", the next generated "Gym" repeat should copy that updated checklist. For example, adding "Leg press" inside the current "Gym" should make "Leg press" part of the next gym checklist.

This keeps the mental model simple: tomorrow's or next week's repeat starts from what the user actually had last time.

Copy-forward should also preserve useful previous completion values as reference values for the next repeat. For example, if the user logged Squats at 80 kg for 8 reps last time, the next Squats finish form should be able to show 80 kg and 8 reps as last-time values.

If the user edits a past completed repeat, the edit should not rewrite later repeats that already exist. The copy source should be the latest active or completed instance at the time the next repeat is generated.

The MVP can generate the next repeat only when the current repeat is completed or dismissed.

### Rotating Recurrence

Some routines repeat as a cycle of different task variants.

Examples:

- Push-Pull-Legs.
- Upper-Lower.
- Week A / Week B.
- A tri-weekly plan where day 1, day 2, and day 3 use different exercises.

Rotating recurrence should support:

- A named cycle.
- Ordered cycle steps.
- Multiple sessions per week.
- Bi-weekly or tri-weekly alternation.
- Copy-forward behavior for each step independently.

Example:

- Cycle: Push-Pull-Legs.
- Steps: Push day, Pull day, Legs day.
- Schedule: 5 sessions per week.
- Generated sequence: Push, Pull, Legs, Push, Pull, then continue with Legs next week.

Each generated step should copy from the previous instance of that same step when possible. For example, the next Pull day should copy the latest previous Pull day, not the latest Legs day.

### Reminder

A reminder decides when the user is notified. Reminder behavior belongs to the task series.

Common reminder modes:

- At due time
- X minutes/hours/days before due time
- Repeated every X minutes until complete
- Only during a time window
- Only at a location
- Only when sensor context matches

### Completion Fields

Completing a task can optionally ask the user for structured values. These fields are configured when the task is set up, not improvised every time the task is completed.

Completion fields make task history useful for charts, filters, and pattern tracking.

Examples:

- Gym exercise: kg, reps, sets, effort, notes.
- Morning weight: body weight.
- Cooking or meal task: calories consumed, protein, carbs, fat.
- Food sensitivity tracking: ate gluten, ate dairy, drank alcohol.
- Health habit: pain level, mood, sleep quality.

Field types:

- Number
- Text
- Boolean flag
- Single choice
- Multi choice
- Duration

For number fields, the task setup should allow:

- User-defined unit tags, such as kg, lbs, reps, kcal, cm, mmol/L, or custom text.
- Integer or decimal values.
- Whether negative values are allowed.

Unit tag picking should work like reusable item picking: show previous unit tags, filter them as the user types, and allow creating a new tag from the text box. Unlike task item reuse, unit tag search should default to wide search because units are shared across tasks, there are not many real-world units, and duplicates should not be allowed.

The task can decide whether each field is optional or required before completion.

### Grouping Tags

Tasks and completion fields can have grouping tags used for statistics across different todo trees.

Grouping tags are not units. They describe what the item means so separate tasks can contribute to the same chart or summary.

Examples:

- Tag `strength` on Squats, Bench press, Deadlift, and Shoulder press to chart total strength training sessions.
- Tag `legs` on Squats, Lunges, and Leg press to summarize leg training volume across different gym routines.
- Tag `body_weight` on Morning weight and Doctor visit weight to chart weight measurements from multiple sources.
- Tag `nutrition` on Dinner, Lunch, and Snack to summarize calories across cooking and eating tasks.
- Tag `gluten` on Dinner, Restaurant meal, and Snack to count days where gluten was eaten.

A task can have multiple grouping tags. Completion fields can also have tags when the statistic belongs to a specific field instead of the whole task.

### Surface

Not all reminders should appear the same way. Each task series should have a surface mode that controls how prominently it appears in the app.

Surface modes:

- Pinned: always visible as a large home-screen button.
- Countdown: visible as a button or tile that moves upward as the due time gets closer.
- Normal: visible in lists, search, and due sections, but not promoted by default.
- Hidden/archive: kept for history or reuse, but not shown in the active home view.

Pinned tasks are for high-frequency, high-value routines that the user should never have to dig for.

Examples:

- Gym
- Supermarket
- Morning routine
- Medicine

Countdown tasks are for dated reminders that become more important as time passes.

Examples:

- Birthday reminder
- Hair dresser appointment
- Dentist appointment
- Renew passport

### Nag Rule

A nag rule is the context-aware part of the app. It decides whether a reminder should be escalated, repeated, delayed, or triggered. Top-level nag behavior belongs to the task series.

Useful first nag rules:

- Time window: nag only between 08:00 and 22:00.
- Repeat until done: keep reminding every N minutes until the task is complete.
- Location arrival: nag when entering a saved place.
- Location departure: nag when leaving a saved place.
- Inactivity: nag if the phone has been still for a chosen period.
- Movement: nag after walking/driving/traveling starts or stops.

### Location Matching

When the app has current location permission, it can compare the user's location against saved places and location-related tasks.

Expected behavior:

- Get the current location when the app opens, when the user requests a refresh, or when the platform provides a background location/geofence event.
- Find saved places whose radius contains the current location.
- Find active tasks with nag rules tied to those places.
- Surface matching tasks on the home screen or send a reminder if the task's reminder rules allow it.

Example:

- User arrives near the supermarket.
- App matches the current location to the saved "Supermarket" place.
- App finds active tasks connected to "Supermarket".
- App shows the supermarket task and its grocery subtasks prominently.

The app should avoid constant GPS polling. It should prefer platform geofencing, app-open refreshes, and user-initiated checks.

## Main Screens

### Today

The front of the app should be action-first, not just a chronological list.

Top section:

- Large pinned buttons for main routines and locations.
- Examples: Gym, Supermarket.
- These should be reachable in one tap.

Urgency section:

- Countdown buttons for dated reminders.
- Items move closer to the top as their due time approaches.
- Examples: birthdays, hair dresser appointments, dentist appointments.

Due section:

- Tasks due today, overdue tasks, and active nagging tasks.

Nearby section:

- Location-related tasks that match the user's current place.
- Examples: Supermarket list when near the supermarket, gym checklist when at the gym.

The ranking should make the app feel like it knows what deserves attention without hiding the user's main routines.

The lower-right plus button adds a new top-level task from this screen.

Bottom actions:

- Lower-left chart button: opens chart setup and saved charts.
- Center history button: opens series/history browsing for the current context.
- Lower-right plus button: opens the contextual add setup sheet.

### Lists

Shows all parent tasks grouped by status, list, or routine.

Opening a parent task should drill into its child list with a horizontal transition. The child list slides in from the right while the parent list moves left. This makes the hierarchy feel spatial: deeper levels are to the right, parent levels are to the left.

The gesture should be supported but not required. Users should be able to return to the parent list by:

- Swiping left-to-right from the child list.
- Tapping a visible back button.
- Tapping a breadcrumb or parent title at the top.

### Task Detail

Allows editing:

- Title
- Icon
- Notes
- Subtasks
- Due date
- Series recurrence
- Series reminder
- Series nag rules
- Series home surface mode
- Series pin order
- Completion fields

The lower-right plus button adds a new child item under the task currently being viewed. For example, opening "Gym" and tapping plus creates a gym-related item, while opening "Supermarket" and tapping plus creates a grocery item.

### Icon Picker

The icon picker should work like other reusable pickers in the app:

- Show common icons immediately.
- Filter icons as the user types.
- Group icons by category, such as health, food, home, work, errands, money, people, and travel.
- Show recently used icons first.
- Allow clearing the icon.

Examples:

- Gym: dumbbell or running icon.
- Supermarket: shopping cart or basket icon.
- Birthday: cake icon.
- Hairdresser: scissors icon.
- Medicine: pill icon.

For built-in task icons, good candidates are open-source icon libraries such as Lucide, Material Symbols, Phosphor, or Iconify-backed packs. The app should store stable icon names, not downloaded image files, for these built-in icons.

For custom user images, services such as Cloudinary or ImageKit can handle automatic resizing and cropping. This should be optional because a personal todo app should still work without an external media account.

### Complete Task

Completing a task should be fast when no completion fields are configured. If completion fields exist, the app opens a small finish form before marking the task complete.

Examples:

- Finishing "Squats" asks for kg, reps, and sets.
- Finishing "Morning weight" asks for body weight.
- Finishing "Dinner" asks for calories and optional flags like ate gluten.

The submitted values become a completion entry. Completion entries are historical records and should remain available even if the task later recurs.

For repeated tasks, the finish form should show previous values where available. The previous values are not new completion values until the user saves the form; they are reference/default values to reduce typing and help the user compare against last time.

Every completed task should be stamped with the completion date and time. If location capture is enabled and permission is available, the completion entry can also store where the task was completed.

Completion location should be optional. The user should be able to disable it globally and per task, because some reminders are private or do not benefit from location history.

### Series History

Repeated tasks form a series. The user should be able to browse that series history by swiping left and right through the repeated copies.

Examples:

- Swipe through previous Gym sessions.
- Swipe through previous Push days.
- Swipe through Morning weight entries.
- Swipe from the current repeat back to the previous repeat to compare values.

The history view should show:

- Task title and icon.
- Completion date and time.
- Completion values.
- Notes.
- Optional location/place.
- Subtask checklist state.

For rotating routines, each step should have its own history. For example, browsing Pull day history should move through Pull days, not Push or Legs days.

The center-bottom history button opens the history view for the current context. On a repeated task, it opens that task series. On a grouping tag or chart context, it can open the relevant filtered history.

History should be a mode, not the default list layout. The normal task list should stay stable and full width for everyday use. When history opens, the active history page can shrink to about 90% width with previous and next pages peeking at the left and right edges. This makes swipe navigation visible without making the main task UI feel like a carousel all the time.

In history mode, past entries should use a muted gray background so the user can tell they are looking at older records. The current/present task should keep the normal active background.

While browsing history, the center-bottom history button should change into a "go to present" action. Pressing it returns the user to the current active task or latest relevant entry.

### Charts

Structured completion values can be charted over time.

Useful first charts:

- Weight over time.
- Gym exercise weight, reps, or volume over time.
- Calories by day.
- Count of flags over time, such as gluten days per month.

The lower-left chart button opens a chart setup menu. The menu should open in context to the currently selected task, task series, or grouping tag so the user does not need to build every chart from scratch.

Examples:

- From "Morning weight", suggest "Weight progression".
- From a `body_weight` grouping tag, suggest all body weight measurements over time.
- From "Squats", suggest kg, reps, and estimated volume over time.
- From `nutrition`, suggest calories per day.

Users should be able to save chart setups and return to them later.

Saved chart setup options:

- Name.
- Source: task, copied task series, grouping tag, or completion field.
- Metric field.
- Aggregation, such as latest, sum, average, min, max, or count.
- Time grouping, such as day, week, month, or raw entries.
- Chart type, such as line, bar, or count.
- Optional filters, such as location, flag value, or date range.

### Add Task

Fast setup sheet with suggestion typeahead.

The plus button opens a floating setup window over the current list instead of navigating away. The setup window should feel lightweight and dismissible.

The setup sheet receives a context:

- `parentId = null`: create a top-level task.
- `parentId = task id`: create a subtask under the current task.

When adding inside a parent task, suggestions should default to previous subitems from that parent. A wide suggestion toggle expands results to old subitems from other parents.

The user should be able to swipe the setup sheet away to cancel. If the user has entered unsaved text or settings, the app should either preserve the draft briefly or ask before discarding.

### Suggestions

Optional management screen for old reusable titles.

### Places

Saved places used by location reminders.

Examples:

- Home
- Work
- Gym
- Grocery store

## MVP Rules

Keep the first version local-first. Do not require an account. Do not add sync until the local model feels correct.

The first version should be useful even if no sensors are enabled. Sensors should improve nagging, not be required for basic reminders.
