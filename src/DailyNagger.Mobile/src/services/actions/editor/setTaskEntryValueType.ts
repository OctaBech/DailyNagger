import type { TaskEntryValueType } from "@/api";
import type { TaskEntry } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { EditorActionScope } from "./contracts";

export function editorTaskEntrySetValueType(
  { memory }: EditorActionScope,
  taskEntry: TaskEntry,
  valueType: TaskEntryValueType,
  rolloverBehaviorInput: TaskEntry["rolloverBehavior"] = taskEntry.rolloverBehavior,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const rolloverBehavior = getTaskEntryValueRolloverBehavior(rolloverBehaviorInput);

  if (
    freshTaskEntry.valueType === valueType &&
    freshTaskEntry.rolloverBehavior === rolloverBehavior
  ) {
    return;
  }

  const taskEntryV1 = node.setTaskEntryValueType(freshTaskEntry, valueType);
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
