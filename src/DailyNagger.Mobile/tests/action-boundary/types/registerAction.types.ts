import { taskInputActions } from "@/services/actions";
import { registerAction } from "@/services/action-boundary/register/actionRegistrationModel";
import type { RuntimeDependenciesForActionScope } from "@/services/action-boundary/action-dependencies";
import type { TaskEntry } from "@/models";

declare const dependencies: RuntimeDependenciesForActionScope<"plan/task-input">;
declare const taskEntry: TaskEntry;

// The argument object is inferred directly from the action function.
const registration = registerAction(taskInputActions.taskEntrySetValue, "plan/task-input");
registration.actionFunction({ taskEntry, newValue: "coffee" }, dependencies);

// @ts-expect-error Package names must come from the service-package object literal.
registerAction(taskInputActions.taskEntrySetValue, "plan/unknown-package");

registerAction(
  // @ts-expect-error This action needs task-input dependencies, not navigation dependencies.
  taskInputActions.taskEntrySetValue,
  "plan/navigation",
);

// @ts-expect-error The registered action still requires both taskEntry and newValue.
registration.actionFunction({ newValue: "coffee" }, dependencies);

// @ts-expect-error The inferred argument type rejects a numeric newValue.
registration.actionFunction({ taskEntry, newValue: 42 }, dependencies);
