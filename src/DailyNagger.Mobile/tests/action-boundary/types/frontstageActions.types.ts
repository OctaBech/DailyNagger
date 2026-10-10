import type { TaskEntry } from "@/models";
import type { ProxyActions } from "@/services/action-boundary";
import type { planScreenActionRegistry } from "@/services/action-boundary/register";

declare const taskEntry: TaskEntry;
declare const frontstageActions: ProxyActions<typeof planScreenActionRegistry>;

frontstageActions.taskEntry.setValue({ taskEntry, newValue: "coffee" });
frontstageActions.taskEntry.setValue({ taskEntry, newValue: null });

// @ts-expect-error setValue requires the newValue property.
frontstageActions.taskEntry.setValue({ taskEntry });

// @ts-expect-error newValue must be a string or null.
frontstageActions.taskEntry.setValue({ taskEntry, newValue: 42 });

// @ts-expect-error setValue requires a TaskEntry, not a string.
frontstageActions.taskEntry.setValue({ taskEntry: "wrong node", newValue: null });

// @ts-expect-error Proxy functions now accept one argument object, not positional arguments.
frontstageActions.taskEntry.setValue(taskEntry, "coffee");
