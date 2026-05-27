# UX Flow

## Contextual Add Button

The app uses a floating plus button in the lower-right corner.

The plus button always adds to the level the user is currently viewing:

- Home screen: create a top-level task.
- Task detail screen: create a child task under the open task.
- Nested task screen: create a child task under the open nested task.

This keeps adding fast and predictable. The user should not need to choose the parent manually in the common case.

Tapping the plus button opens a floating setup sheet over the current list. It should not navigate the user away from the current level.

The setup sheet can be dismissed by swiping it away. If nothing has been entered, the sheet closes immediately. If the user has typed a title or changed settings, the app should protect that draft by briefly preserving it or confirming discard.

The lower-left chart button opens chart setup and saved charts. It mirrors the lower-right plus button: plus creates items, chart creates or opens views over the user's tracked data.

The center-bottom history button opens the current context's history. The bottom layout should be stable:

- Left: charts.
- Center: history.
- Right: add.

## Examples

### Home

User taps plus on the home screen.

Result:

- Adds a top-level item such as "Gym", "Supermarket", "Pay rent", or "Hair dresser".

### Gym

User opens "Gym" and taps plus.

Result:

- Adds a gym-related child item such as "Squats", "Bench press", or "Stretching".

### Supermarket

User opens "Supermarket" and taps plus.

Result:

- Adds a grocery child item such as "Milk", "Eggs", or "Coffee".

## Nested List Navigation

Pressing a parent task opens its child list with a horizontal drill-in transition.

Recommended behavior:

- Child list slides in from the right.
- Parent list shifts left and is replaced by the child level.
- Back navigation slides the child list right and returns the parent list from the left.
- Swipe left-to-right returns to the parent level.
- A visible back button or breadcrumb is always shown.

This keeps the user's mental model simple: parent levels are to the left, deeper levels are to the right. The gesture is useful once learned, but the visible back affordance keeps the app understandable for first-time users.

For wide screens or tablets, the app can later use a split view where the parent list remains visible on the left and the selected child list appears on the right.

## Suggestions

Suggestions are contextual by default.

When adding inside "Gym", the suggestion list should primarily show old gym items. When adding inside "Supermarket", it should primarily show old supermarket items.

The add screen has a wide suggestion toggle.

Default mode:

- Only old items from the current parent task.

Wide mode:

- Include old items from other tasks.
- Keep current-parent suggestions ranked first.
- Show where wide suggestions came from, such as "Coffee - from Supermarket".

## Add Screen Behavior

The add setup sheet should know its context before it opens:

```ts
type AddContext = {
  parentId: string | null;
};
```

The user should be able to add several items quickly without leaving the current level.

After saving an item, the sheet can stay open with an empty title field for rapid entry, especially inside lists like Gym or Supermarket. The user can swipe it away when done.

## Icon Picking

Task setup should include an optional icon picker.

Recommended MVP:

- Built-in searchable icon library.
- Recently used icons.
- Emoji fallback.
- Clear icon action.

The icon picker should open as a small sheet from the setup window. The user can search words like "gym", "food", "birthday", "doctor", or "money" and choose a matching icon.

Custom images can be added later, but they should not be required for the first version. They add permissions, storage, cropping, and backup concerns.

For normal task icons, prefer bundled icons over requesting icons from a remote service at runtime. Remote image services make more sense for optional custom images, where automatic resize and crop behavior is useful.

## Chart Setup

The chart icon lives in the lower-left corner.

Pressing it opens a chart setup menu in the current context:

- From Morning weight: suggest a weight progression chart.
- From Squats: suggest kg, reps, or volume over time.
- From a grouping tag like `body_weight`: suggest all body weight entries.
- From a grouping tag like `nutrition`: suggest calories by day.

The user can adjust the source, metric, aggregation, date grouping, filters, and chart type, then save the chart setup.

Saved chart setups should be available from the chart menu so the user can quickly reopen common views.

## Adding Inside Repeating Tasks

When the user adds a child item inside a repeating task, the child item should be copied into the next repeat.

Example:

- "Gym" repeats weekly.
- User opens "Gym".
- User taps plus and adds "Leg press".
- User completes or dismisses the current "Gym".
- The next "Gym" is created by copying the current "Gym".
- "Leg press" appears in the next gym checklist.

For the MVP, the next repeat should be generated from the latest previous repeat. This avoids a separate template concept and matches the idea that the future copy starts from what the user actually used last time.

The copied repeat should also be able to show previous completion values. If the user did Squats at 80 kg for 8 reps last time, the next Squats finish form should display those values as last-time context or defaults.

## Rotating Routines

The repeat setup should support routines with multiple rotating variants.

Example:

- User creates a gym cycle named Push-Pull-Legs.
- User adds three steps: Push day, Pull day, Legs day.
- User sets 5 sessions per week.
- The app schedules Push, Pull, Legs, Push, Pull, then continues with Legs next.

For copy-forward behavior, each rotating step should copy from the previous instance of the same step. A new Pull day should show the previous Pull exercises and values, not the previous Legs day.

## Series History Browsing

Repeated tasks should have a history view where the user can swipe left and right through the series.

Examples:

- In Gym, swipe back to previous gym sessions.
- In Pull day, swipe through previous Pull days.
- In Morning weight, swipe through previous measurements.

The direction should feel chronological:

- Swipe right or use a previous control to see older repeats.
- Swipe left or use a next control to return toward newer repeats.

Each history page should show the completed task state, completion values, notes, date/time, and optional location. This makes it easy to compare today with last time without opening charts.

The history view opens from the center-bottom history button.

History should open as a distinct mode:

- The current history page is centered at about 90% width.
- Previous and next history pages peek from the left and right edges.
- This visual hint teaches that the user can swipe.
- The normal task list should not always use this layout.
- Past entries use a muted gray background.
- The current/present entry uses the normal active background.

Reasoning: the everyday list should feel stable and direct. The side-peek carousel treatment is useful when browsing history, but it would add visual noise if it were always active.

In history mode, the center-bottom button changes from history to "go to present". Tapping it jumps back to the current active task or latest relevant entry.

## Completion Flow

Tasks can have completion fields configured during setup.

If a task has no completion fields, tapping complete marks it done immediately.

If a task has completion fields, tapping complete opens a finish form before the task is marked done.

Examples:

- Squats: kg, reps, sets.
- Morning weight: body weight.
- Dinner: calories, ate gluten.

When configuring numeric completion fields, the setup screen should let the user choose or create a unit tag, choose integer or decimal input, and decide whether negative values are allowed.

Unit tag picking should use the same interaction pattern as reusable items:

- Show existing unit tags immediately.
- Filter as the user types.
- Allow creating a new tag from the typed value.
- Default to wide search across all unit tags.

This differs from task and subtask reuse, which defaults to narrow search inside the current parent task and only widens when the user toggles wide suggestions. Unit tags default wide because there are not many real-world units and duplicate unit labels should not be allowed.

Grouping tag picking should behave like unit tag picking. Tags are global, searchable, and duplicate labels are not allowed.

Example where grouping tags matter:

- The user has "Gym" with Squats and Bench press.
- The user also has "Morning routine" with Morning weight.
- The user has "Dinner" with calories and ate gluten.
- Squats and Bench press can both use `strength` for charts about strength training.
- Morning weight can use `body_weight` for body-weight charts.
- Dinner calories can use `nutrition`, while the ate-gluten flag can use `gluten`.

The finish form should be short and optimized for repeated use. Numeric fields should use numeric keyboards, boolean flags should use toggles or checkboxes, and common choices should use segmented controls or chips.

After saving the finish form, the app stores the values as history for charts and then completes the task.

For repeated tasks, previous values should be visible but not silently saved as new values. The user still confirms or changes them before completing the new repeat.

When the user completes a task, the app should always stamp the completion date and time. If location capture is enabled, the finish flow can also attach the current location or a matched saved place.

Location capture should be quiet and optional. If permission is missing or disabled for the task, completion still works without location.

## Location Related Tasks

When location permission is available, the app can use the current location to find relevant tasks.

Example:

- User opens the app near the supermarket.
- The app checks current location.
- The app matches the location to the saved "Supermarket" place.
- The home screen shows the supermarket task and grocery subtasks in a nearby section.

This should feel like helpful surfacing, not a blocking flow. If location is unavailable, the app should simply skip nearby matching and keep the normal home screen.
