# Data Model

This model is written to work well with SQLite and React Native.

## Task

```ts
type Task = {
  id: string;
  seriesId: string | null;
  copiedFromTaskId: string | null;
  parentId: string | null;
  title: string;
  iconKind: "none" | "builtin" | "emoji" | "image";
  iconValue: string | null;
  notes: string | null;
  status: "active" | "completed" | "dismissed" | "archived";
  surfaceMode: "pinned" | "countdown" | "normal" | "hidden";
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  sortOrder: number;
  pinOrder: number | null;
};
```

`parentId` creates nested lists. A task with `parentId: null` is a top-level task. A task with a parent is a subtask.

`seriesId` links a task to the series it belongs to. Series-level behavior such as recurrence, reminders, nag rules, and surface mode should be defined on the series, not redefined in child layers.

`copiedFromTaskId` links a repeated task to the previous instance it was copied from.

When a subtask is added under a recurring task, the next repeat should copy the updated task and its current child tasks. This means changes roll forward by copying the previous repeat instead of editing a separate template.

## Task Series

```ts
type TaskSeries = {
  id: string;
  title: string;
  iconKind: "none" | "builtin" | "emoji" | "image";
  iconValue: string | null;
  surfaceMode: "pinned" | "countdown" | "normal" | "hidden";
  pinOrder: number | null;
  defaultLocationCapture: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};
```

A series contains meta behavior for a repeated or reusable task family.

Examples:

- Gym series.
- Supermarket series.
- Morning weight series.
- Birthday reminder series.

Series behavior should not change in sublayers. Child tasks belong to the same series and inherit the series-level behavior. A child task can have its own title, notes, icon, completion fields, and grouping tags, but it should not define independent recurrence, reminder, top-level nag, or home-surface behavior.

Top-level tasks and child tasks can live in the same `tasks` table. A task becomes a list when other tasks reference it as `parentId`.

## Recurrence Rule

```ts
type RecurrenceRule = {
  id: string;
  seriesId: string;
  kind: "none" | "weekly" | "monthly" | "yearly" | "specific_date" | "custom_interval" | "rotating";
  intervalCount: number | null;
  intervalUnit: "day" | "week" | "month" | "year" | null;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  specificDate: string | null;
  startAt: string | null;
  endAt: string | null;
};
```

Examples:

- Weekly gym task: `kind = "weekly"`, `daysOfWeek = [1, 3, 5]`
- Every 3 days: `kind = "custom_interval"`, `intervalCount = 3`, `intervalUnit = "day"`
- Birthday: `kind = "yearly"`, `dayOfMonth = 12`, `monthOfYear = 8`
- Push-Pull-Legs: `kind = "rotating"` with cycle steps.

## Recurrence Cycle

```ts
type RecurrenceCycle = {
  id: string;
  name: string;
  repeatEveryCount: number;
  repeatEveryUnit: "week" | "month";
  sessionsPerPeriod: number | null;
  createdAt: string;
  updatedAt: string;
};
```

## Recurrence Cycle Step

```ts
type RecurrenceCycleStep = {
  id: string;
  cycleId: string;
  taskId: string;
  label: string;
  stepOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

Rotating schedules use cycle steps to generate different task variants in order.

Examples:

- Push day
- Pull day
- Legs day
- Week A
- Week B

When generating a new repeat for a cycle step, the app should copy from the previous task instance for that same step when available.

## Reminder Rule

```ts
type ReminderRule = {
  id: string;
  seriesId: string;
  mode: "at_due_time" | "before_due_time" | "after_due_time" | "repeat_until_done";
  offsetMinutes: number | null;
  repeatEveryMinutes: number | null;
  quietStartTime: string | null;
  quietEndTime: string | null;
  enabled: boolean;
};
```

## Nag Rule

```ts
type NagRule = {
  id: string;
  seriesId: string;
  kind: "time_window" | "location_arrival" | "location_departure" | "inactivity" | "movement";
  placeId: string | null;
  startTime: string | null;
  endTime: string | null;
  thresholdMinutes: number | null;
  enabled: boolean;
};
```

## Place

```ts
type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  lastMatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## Suggestion

```ts
type Suggestion = {
  id: string;
  title: string;
  scope: "task" | "subtask";
  parentTaskId: string | null;
  useCount: number;
  lastUsedAt: string;
  createdAt: string;
};
```

## Completion Field

```ts
type CompletionField = {
  id: string;
  taskId: string;
  label: string;
  valueType: "number" | "text" | "boolean" | "single_choice" | "multi_choice" | "duration";
  unitTagId: string | null;
  numberKind: "integer" | "float" | null;
  allowNegative: boolean;
  required: boolean;
  choices: string[] | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
```

Completion fields are configured on the task. They define what the app asks for when the task is completed.

Examples:

- `kg`, number, unit tag `kg`, decimal, no negative values
- `reps`, number
- `body weight`, number, unit tag `kg`, decimal, no negative values
- `calories`, number, unit tag `kcal`, integer, no negative values
- `ate gluten`, boolean

## Unit Tag

```ts
type UnitTag = {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};
```

Unit tags are user-defined labels for measurements. They should not be hardcoded to a fixed unit list.

Examples:

- kg
- lbs
- reps
- kcal
- cm
- mmol/L
- plates
- custom household units

Unit tag lookup should default to wide search across all unit tags. The user can type to filter the list and create a new unit tag if no existing tag matches. Unit tags should be unique because there are not many real-world units and duplicate labels would make charts harder to understand.

## Grouping Tag

```ts
type GroupingTag = {
  id: string;
  label: string;
  createdAt: string;
  updatedAt: string;
};
```

Grouping tags classify tasks or completion fields for statistics across the todo hierarchy.

Examples:

- `strength`
- `legs`
- `body_weight`
- `nutrition`
- `gluten`

```ts
type TaskGroupingTag = {
  taskId: string;
  groupingTagId: string;
};
```

```ts
type CompletionFieldGroupingTag = {
  completionFieldId: string;
  groupingTagId: string;
};
```

## Completion Entry

```ts
type CompletionEntry = {
  id: string;
  taskId: string;
  completedAt: string;
  latitude: number | null;
  longitude: number | null;
  locationAccuracyMeters: number | null;
  placeId: string | null;
  note: string | null;
  createdAt: string;
};
```

## Completion Value

```ts
type CompletionValue = {
  id: string;
  completionEntryId: string;
  completionFieldId: string;
  previousCompletionValueId: string | null;
  numberValue: number | null;
  textValue: string | null;
  booleanValue: boolean | null;
  choiceValue: string | null;
  createdAt: string;
};
```

Completion values are stored separately from task setup so recurring tasks can keep historical measurements over time.

`previousCompletionValueId` can link a saved value to the value it was based on from the previous repeated task. This is useful for auditability and for showing progress over time, but the app can also compute previous values by looking up the latest completion value for the copied-from task.

## Saved Chart

```ts
type SavedChart = {
  id: string;
  name: string;
  sourceKind: "task" | "task_series" | "grouping_tag" | "completion_field";
  sourceId: string;
  metricCompletionFieldId: string | null;
  aggregation: "latest" | "sum" | "average" | "min" | "max" | "count";
  timeGrouping: "raw" | "day" | "week" | "month";
  chartType: "line" | "bar" | "count";
  filterJson: string | null;
  createdAt: string;
  updatedAt: string;
};
```

Saved charts are reusable chart definitions. They do not store chart results; results are computed from completion entries and completion values.

## SQLite Tables

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  series_id TEXT REFERENCES task_series(id) ON DELETE SET NULL,
  copied_from_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon_kind TEXT NOT NULL DEFAULT 'none',
  icon_value TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  surface_mode TEXT NOT NULL DEFAULT 'normal',
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  pin_order INTEGER
);

CREATE TABLE task_series (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon_kind TEXT NOT NULL DEFAULT 'none',
  icon_value TEXT,
  surface_mode TEXT NOT NULL DEFAULT 'normal',
  pin_order INTEGER,
  default_location_capture INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);

CREATE TABLE recurrence_rules (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES task_series(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  interval_count INTEGER,
  interval_unit TEXT,
  days_of_week TEXT,
  day_of_month INTEGER,
  month_of_year INTEGER,
  specific_date TEXT,
  start_at TEXT,
  end_at TEXT
);

CREATE TABLE recurrence_cycles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  repeat_every_count INTEGER NOT NULL DEFAULT 1,
  repeat_every_unit TEXT NOT NULL DEFAULT 'week',
  sessions_per_period INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE recurrence_cycle_steps (
  id TEXT PRIMARY KEY,
  cycle_id TEXT NOT NULL REFERENCES recurrence_cycles(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE reminder_rules (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES task_series(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  offset_minutes INTEGER,
  repeat_every_minutes INTEGER,
  quiet_start_time TEXT,
  quiet_end_time TEXT,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE nag_rules (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES task_series(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
  start_time TEXT,
  end_time TEXT,
  threshold_minutes INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  last_matched_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE suggestions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  scope TEXT NOT NULL,
  parent_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE unit_tags (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE grouping_tags (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE task_grouping_tags (
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  grouping_tag_id TEXT NOT NULL REFERENCES grouping_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, grouping_tag_id)
);

CREATE TABLE completion_field_grouping_tags (
  completion_field_id TEXT NOT NULL REFERENCES completion_fields(id) ON DELETE CASCADE,
  grouping_tag_id TEXT NOT NULL REFERENCES grouping_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (completion_field_id, grouping_tag_id)
);

CREATE TABLE completion_fields (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value_type TEXT NOT NULL,
  unit_tag_id TEXT REFERENCES unit_tags(id) ON DELETE SET NULL,
  number_kind TEXT,
  allow_negative INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  choices TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE completion_entries (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  location_accuracy_meters REAL,
  place_id TEXT REFERENCES places(id) ON DELETE SET NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE completion_values (
  id TEXT PRIMARY KEY,
  completion_entry_id TEXT NOT NULL REFERENCES completion_entries(id) ON DELETE CASCADE,
  completion_field_id TEXT NOT NULL REFERENCES completion_fields(id) ON DELETE CASCADE,
  previous_completion_value_id TEXT REFERENCES completion_values(id) ON DELETE SET NULL,
  number_value REAL,
  text_value TEXT,
  boolean_value INTEGER,
  choice_value TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE saved_charts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_id TEXT NOT NULL,
  metric_completion_field_id TEXT REFERENCES completion_fields(id) ON DELETE SET NULL,
  aggregation TEXT NOT NULL,
  time_grouping TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  filter_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_series_id ON tasks(series_id);
CREATE INDEX idx_tasks_copied_from_task_id ON tasks(copied_from_task_id);
CREATE INDEX idx_tasks_due_at ON tasks(due_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_surface_mode ON tasks(surface_mode);
CREATE INDEX idx_tasks_icon_kind ON tasks(icon_kind);
CREATE INDEX idx_recurrence_cycle_steps_cycle_id ON recurrence_cycle_steps(cycle_id);
CREATE INDEX idx_recurrence_cycle_steps_task_id ON recurrence_cycle_steps(task_id);
CREATE INDEX idx_recurrence_rules_series_id ON recurrence_rules(series_id);
CREATE INDEX idx_reminder_rules_series_id ON reminder_rules(series_id);
CREATE INDEX idx_nag_rules_series_id ON nag_rules(series_id);
CREATE INDEX idx_nag_rules_place_id ON nag_rules(place_id);
CREATE INDEX idx_suggestions_title ON suggestions(title);
CREATE INDEX idx_suggestions_parent_task_id ON suggestions(parent_task_id);
CREATE INDEX idx_unit_tags_label ON unit_tags(label);
CREATE INDEX idx_grouping_tags_label ON grouping_tags(label);
CREATE INDEX idx_task_grouping_tags_tag_id ON task_grouping_tags(grouping_tag_id);
CREATE INDEX idx_completion_field_grouping_tags_tag_id ON completion_field_grouping_tags(grouping_tag_id);
CREATE INDEX idx_completion_fields_task_id ON completion_fields(task_id);
CREATE INDEX idx_completion_entries_task_id ON completion_entries(task_id);
CREATE INDEX idx_completion_entries_completed_at ON completion_entries(completed_at);
CREATE INDEX idx_completion_entries_place_id ON completion_entries(place_id);
CREATE INDEX idx_completion_values_field_id ON completion_values(completion_field_id);
CREATE INDEX idx_completion_values_previous_value_id ON completion_values(previous_completion_value_id);
CREATE INDEX idx_saved_charts_source ON saved_charts(source_kind, source_id);
```

## Completion History

When a task is completed:

1. Create a `completion_entries` row.
2. Store one `completion_values` row per submitted field value.
3. Stamp `completed_at` with the actual completion date and time.
4. If enabled and permitted, store completion latitude, longitude, accuracy, and matched place.
5. Mark the task complete or generate the next occurrence if it is recurring.
6. Keep the completion entry as immutable history unless the user explicitly edits it.

Charts should read from `completion_entries` and `completion_values`, not from the current task row.

Location should be treated as optional completion metadata. The app should not require location permission to complete a task.

## Saved Chart Setups

The chart button should open chart setup in context.

Context examples:

- Current task: chart fields recorded directly on that task.
- Task series: chart repeated copies linked by `seriesId`.
- Grouping tag: chart values across tasks with the same grouping tag.
- Completion field: chart one specific measurement field.

Example saved chart:

- Name: Weight progression.
- Source kind: grouping tag.
- Source id: `body_weight`.
- Metric: body weight field.
- Aggregation: latest.
- Time grouping: day.
- Chart type: line.

Another example:

- Name: Weekly training volume.
- Source kind: grouping tag.
- Source id: `strength`.
- Metric: volume field.
- Aggregation: sum.
- Time grouping: week.
- Chart type: bar.

## Location Matching

Location matching finds active tasks relevant to where the user is now.

Inputs:

- Current latitude and longitude.
- Saved places with latitude, longitude, and radius.
- Enabled nag rules with a `placeId`.
- Active series connected to those nag rules.
- Active tasks belonging to those series.

Basic algorithm:

1. Get current location if permission is available.
2. Find saved places within radius.
3. Find enabled nag rules for those places.
4. Find active series for those nag rules.
5. Find active top-level tasks belonging to those series.
6. Show matching tasks in a nearby section or trigger reminders if allowed.

The first implementation can do distance checks in application code because the number of saved places should be small. If place count grows large, add a bounding-box prefilter or spatial index.

The app should not depend on constant background GPS polling. Prefer:

- App-open location refresh.
- Manual refresh.
- Platform geofence events.
- Coarse location when exact location is unnecessary.

## Recurring Task Copies

Recurring tasks should repeat by copying the previous instance.

Previous instance:

- Holds the current checklist.
- Holds the current completion field setup.
- Holds the latest completion values.
- Acts as the source for the next repeat.
- Belongs to a series that defines repeat behavior.

Next instance:

- Is created by copying the previous instance.
- Links back to the source with `copiedFromTaskId`.
- Keeps the same `seriesId`.
- Gets its own task rows and child task rows.
- Can show copied previous values as references or defaults in the finish form.
- Can be edited independently after creation.

Default MVP behavior:

1. User opens recurring "Gym".
2. User taps plus and adds "Leg press".
3. User completes or dismisses the current "Gym".
4. The app creates the next "Gym" by copying the current one.
5. The next "Gym" includes "Leg press".
6. The next "Gym" can show last-time values, such as previous kg and reps.

This model avoids a separate template task object. The source of truth for the next repeat's content is the latest repeated task at generation time, while repeat behavior lives on `task_series`.

## Rotating Recurrence

Rotating recurrence handles routines where the next task is selected from an ordered cycle.

Example:

1. Cycle is Push-Pull-Legs.
2. Steps are Push day, Pull day, Legs day.
3. Schedule asks for 5 sessions per week.
4. The app generates Push, Pull, Legs, Push, Pull.
5. The next generated session continues with Legs.

Copy source rule:

- If generating Push day, copy from the previous Push day.
- If generating Pull day, copy from the previous Pull day.
- If generating Legs day, copy from the previous Legs day.
- If no previous same-step task exists, copy from the configured step task.

This lets exercises and previous values evolve separately per training day.

## Previous Values In Finish Forms

When finishing a repeated task, the app should be able to show previous values from the copied-from task.

Example:

1. User completes "Squats" with 80 kg and 8 reps.
2. The next "Squats" is created by copying the previous one.
3. When the user finishes the next "Squats", the form shows 80 kg and 8 reps as last-time values.
4. The user can keep, edit, or clear those values before saving.

Previous values are not automatically counted as new history until the user completes and saves the new task.

## Series History

A task series is the family of repeated copies connected by `seriesId`. Individual copy lineage is still available through `copiedFromTaskId`.

The app should be able to traverse a series:

- Series query: find tasks with the same `seriesId`.
- Newer copy lineage: find a task whose `copiedFromTaskId` points to the current task.
- Older copy lineage: follow the current task's `copiedFromTaskId`.

For rotating recurrence, the app should browse history for the same cycle step. That means Pull day history follows previous Pull day copies, not every gym task in chronological order.

The first implementation should use `seriesId` for broad history queries and `copiedFromTaskId` for adjacent previous/next navigation.

## Home Ranking

The home screen should not rank every task with the same rules.

Pinned tasks:

1. Show first as large buttons.
2. Sort by `pinOrder`, then title.
3. Do not disappear just because they are not due today.

Countdown tasks:

1. Sort by due time ascending.
2. Promote overdue items above upcoming items.
3. Show remaining time, such as "in 3 days", "tomorrow", or "overdue".
4. Move higher as remaining time decreases.

Normal tasks:

1. Show in due today, overdue, or list views.
2. Do not take over the top of the home screen unless due or actively nagging.

## Suggestion Filtering

Initial ranking:

Contextual mode:

1. Match the current add context.
2. On the home screen, use suggestions where `scope = "task"` and `parentTaskId IS NULL`.
3. Inside a task, use suggestions where `scope = "subtask"` and `parentTaskId` matches the open task.
4. Rank by case-insensitive prefix match.
5. Then rank by case-insensitive word-start match.
6. Then rank by higher `useCount`.
7. Then rank by newer `lastUsedAt`.

Wide suggestion mode:

1. Keep the same text ranking.
2. Include matching suggestions from other parent tasks.
3. Prefer current-parent matches above other-parent matches.
4. Show enough context to make reused items understandable, such as the original parent task name.

Defaults:

- Task and subtask reuse defaults to contextual mode.
- Unit tag reuse defaults to wide mode.

The query should be fast enough with a normal index at first. If suggestion history grows large, add full-text search later.

## Unit Tag Filtering

Initial ranking:

1. Case-insensitive prefix match.
2. Case-insensitive word-start match.
3. Alphabetical label.

Unit tag filtering does not use parent task context by default. Units are global labels and should be easy to reuse across gym, food, health, and other task types.

## Task Icons

Task icons should be stored as a simple kind/value pair.

Examples:

- `iconKind = "builtin"`, `iconValue = "dumbbell"`
- `iconKind = "builtin"`, `iconValue = "shopping-cart"`
- `iconKind = "emoji"`, `iconValue = "🎂"`
- `iconKind = "none"`, `iconValue = null`

Built-in icon values should refer to stable icon names from the app's icon library. Emoji values can be stored directly. Custom images should store a local file reference later, but custom images are not required for the MVP.

Icon search should be global, searchable, and ranked by recent use plus text match.

## Grouping Tag Filtering

Grouping tag lookup should behave like unit tag lookup:

1. Show existing grouping tags.
2. Filter as the user types.
3. Allow creating a new tag from the typed value.
4. Do not allow duplicate labels.

Grouping tags are global because their purpose is cross-task statistics.
