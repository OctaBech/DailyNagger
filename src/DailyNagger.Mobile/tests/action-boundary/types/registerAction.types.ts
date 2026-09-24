import type { TaskEntry } from "@/models";
import { taskInputActions } from "@/services/actions";
import { registerAction } from "@/services/action-boundary/register/actionRegistrationModel";

const toTaskEntryArguments = (taskEntry: TaskEntry, newValue: string | null) => ({
  taskEntry,
  newValue,
});

// This action accepts the dependency package selected by plan/task-input.
registerAction(taskInputActions.taskEntrySetValue, toTaskEntryArguments, "plan/task-input");

registerAction(
  // @ts-expect-error This action needs task-input dependencies, not navigation dependencies.
  taskInputActions.taskEntrySetValue,
  toTaskEntryArguments,
  "plan/navigation",
);

registerAction(
  taskInputActions.taskEntrySetValue,
  // @ts-expect-error taskEntrySetValue requires both taskEntry and newValue.
  (taskEntry: TaskEntry) => ({ taskEntry }),
  "plan/task-input",
);

registerAction(
  taskInputActions.taskEntrySetValue,
  // @ts-expect-error newValue must be a string or null.
  (taskEntry: TaskEntry, newValue: number) => ({ taskEntry, newValue }),
  "plan/task-input",
);
