import type { TaskEntryValueType } from "@/api";
import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorRuntimeDependencies } from "./contracts";

export function editorTaskEntrySetValueType(
  args: {
    readonly taskEntry: TaskEntry;
    readonly valueType: TaskEntryValueType;
    readonly rolloverBehavior?: TaskEntry["rolloverBehavior"];
  },
  { memory }: EditorRuntimeDependencies,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, args.taskEntry);
  const rolloverBehavior = getTaskEntryValueRolloverBehavior(
    args.rolloverBehavior ?? args.taskEntry.rolloverBehavior,
  );

  if (
    freshTaskEntry.valueType === args.valueType &&
    freshTaskEntry.rolloverBehavior === rolloverBehavior
  ) {
    return;
  }

  const taskEntryV1 = node.setTaskEntryValueType(freshTaskEntry, args.valueType);
  const taskEntryV2 = node.setTaskEntryRolloverBehavior(taskEntryV1, rolloverBehavior);
  const taskEntryV3 = node.tryPrefillCarryOverTaskEntryValueFromHistory(taskEntryV2);
  const newTree = tree.replaceTaskEntry(freshTree, taskEntryV3);

  memory.write.setTree(newTree);
}

function getTaskEntryValueRolloverBehavior(
  rolloverBehavior: TaskEntry["rolloverBehavior"],
): "MoveValueToHistory" | "CarryOverValue" {
  return rolloverBehavior === "CarryOverValue" ? "CarryOverValue" : "MoveValueToHistory";
}

