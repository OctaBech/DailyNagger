import type { TaskEntry } from "@/models";
import type { JsxActionPack } from "@/services/action-boundary";
import type { planScreenActionRegistry } from "@/services/action-boundary/register";

declare const taskEntry: TaskEntry;
declare const frontstageActions: JsxActionPack<typeof planScreenActionRegistry>;

frontstageActions.taskEntry.setValue(taskEntry, "coffee");
frontstageActions.taskEntry.setValue(taskEntry, null);

// @ts-expect-error setValue requires newValue as its second argument.
frontstageActions.taskEntry.setValue(taskEntry);

// @ts-expect-error newValue must be a string or null.
frontstageActions.taskEntry.setValue(taskEntry, 42);
