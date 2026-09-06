import type { Nagger, TaskEntry, TaskItem, TaskLog } from "@/models";
import { treeOperations } from "@/services/tree-operations";
import type { Memory } from "../memory";

export type NavigationActionScope = {
  readonly memory: Memory;
};

export function naggerSetExpanded(
  { memory }: NavigationActionScope,
  nagger: Nagger,
  isExpanded: boolean,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const naggerV1 = node.setNaggerExpanded(freshNagger, isExpanded);
  const result = tree.replaceNode(freshTree, naggerV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function naggerSetFocused({ memory }: NavigationActionScope, nagger: Nagger): void {
  const { tree } = treeOperations;
  const { freshTree, freshNagger } = tree.readNagger(memory, nagger);
  const result = tree.replaceNode(freshTree, freshNagger);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskLogSetFocused({ memory }: NavigationActionScope, taskLog: TaskLog): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskLog } = tree.readTaskLog(memory, taskLog);
  const result = tree.replaceNode(freshTree, freshTaskLog);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskItemSetExpanded(
  { memory }: NavigationActionScope,
  taskItem: TaskItem,
  isExpanded: boolean,
): void {
  const { tree, node } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const taskItemV1 = node.setTaskItemExpanded(freshTaskItem, isExpanded);
  const result = tree.replaceNode(freshTree, taskItemV1);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskItemSetFocused({ memory }: NavigationActionScope, taskItem: TaskItem): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskItem } = tree.readTaskItem(memory, taskItem);
  const result = tree.replaceNode(freshTree, freshTaskItem);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}

export function taskEntrySetFocused({ memory }: NavigationActionScope, taskEntry: TaskEntry): void {
  const { tree } = treeOperations;
  const { freshTree, freshTaskEntry } = tree.readTaskEntry(memory, taskEntry);
  const result = tree.replaceNode(freshTree, freshTaskEntry);

  memory.write.setTreeAndSelectedPath(result.newTree, result.newPath);
}
