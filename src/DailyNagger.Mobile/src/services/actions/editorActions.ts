import type { TaskItem, TaskLog } from "@/models";
import { NodeTemplates } from "@/services/core-node-templates";
import type { SelectedDeleteContext, SelectedMoveContext } from "@/services/core-node-operations";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { editorOperations, inputOperations } from "@/services/operations";
import type { Memory } from "../memory";

type EditorActionScope = {
  readonly memory: Memory;
};

type MoveDirection = "up" | "down";

export function editorTaskEntryAdd(
  { memory }: EditorActionScope,
  taskLog: TaskLog,
  taskItem: TaskItem,
): void {
  const newTaskEntry = NodeTemplates.getTaskEntry(taskLog, taskItem);

  const currentTree = memory.read.getTree();

  const treeWithNewTaskEntry = editorOperations.addTaskEntryToTaskItem(
    currentTree,
    taskItem,
    newTaskEntry,
  );

  memory.write.setTree(treeWithNewTaskEntry);
}

export function editorTaskItemAdd(
  { memory }: EditorActionScope,
  taskLog: TaskLog,
  taskItem: TaskItem | null,
): void {
  const newTaskItem = NodeTemplates.getTaskItem(taskLog, taskItem);
  const currentTree = memory.read.getTree();
  const targetPath = selectedPathOperations.refreshPathToNode(currentTree, taskItem ?? taskLog);

  const treeWithNewTaskItem =
    taskItem !== null
      ? editorOperations.addTaskItemToTaskItem(currentTree, taskItem, newTaskItem)
      : editorOperations.addTaskItemToTaskLog(currentTree, taskLog, newTaskItem);

  const treeWithUpdatedDescendantCount = editorOperations.updateDescendantTaskItemCount(
    treeWithNewTaskItem,
    targetPath,
    +1,
  );

  memory.write.setTree(treeWithUpdatedDescendantCount);
}

export function editorMoveSelectedNodeUp(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "up");
}

export function editorMoveSelectedNodeDown(
  scope: EditorActionScope,
  moveContext: SelectedMoveContext,
): void {
  moveSelectedNode(scope, moveContext, "down");
}

function moveSelectedNode(
  { memory }: EditorActionScope,
  moveContext: SelectedMoveContext,
  direction: MoveDirection,
): void {
  if (direction === "up" && moveContext.selectedIndex === 0) return;
  if (direction === "down" && moveContext.selectedIndex === moveContext.siblingCount - 1) return;

  const currentTree = memory.read.getTree();

  const result =
    moveContext.kind === "task-entry-in-task-item"
      ? editorOperations.moveTaskEntryInTaskItem(
          direction,
          moveContext.selectedNode,
          moveContext.parentNode,
          currentTree,
        )
      : moveContext.kind === "task-item-in-task-item"
        ? editorOperations.moveTaskItemInTaskItem(
            direction,
            moveContext.selectedNode,
            moveContext.parentNode,
            currentTree,
          )
        : editorOperations.moveTaskItemInTaskLog(
            direction,
            moveContext.selectedNode,
            moveContext.parentNode,
            currentTree,
          );

  const refreshedPath = selectedPathOperations.refreshPathToNode(
    result.tree,
    moveContext.selectedNode,
  );

  memory.write.setTreeAndSelectedPath(result.tree, refreshedPath);
}

export function editorDeleteSelectedNode(
  { memory }: EditorActionScope,
  deleteContext: SelectedDeleteContext,
): void {
  const currentTree = memory.read.getTree();

  if (deleteContext.kind === "task-entry-in-task-item") {
    const result = editorOperations.deleteTaskEntryFromTaskItem(
      deleteContext.selectedNode,
      deleteContext.parentNode,
      currentTree,
    );

    memory.write.setTreeAndSelectedPath(result.tree, result.treePath);
    return;
  }

  const selectedPath = selectedPathOperations.refreshPathToNode(
    currentTree,
    deleteContext.selectedNode,
  );
  const treeWithDoneCountAdjusted =
    deleteContext.selectedNode.isDone === false
      ? currentTree
      : inputOperations.updateDoneDescendantTaskItemCount(currentTree, selectedPath, -1);

  const treeWithReducedTaskItemDoneCount = editorOperations.updateDescendantTaskItemCount(
    treeWithDoneCountAdjusted,
    selectedPath,
    -1,
  );

  const result =
    deleteContext.kind === "task-item-in-task-log"
      ? editorOperations.deleteTaskItemFromTaskLog(
          deleteContext.selectedNode,
          deleteContext.parentNode,
          treeWithReducedTaskItemDoneCount,
        )
      : editorOperations.deleteTaskItemFromTaskItem(
          deleteContext.selectedNode,
          deleteContext.parentNode,
          treeWithReducedTaskItemDoneCount,
        );

  memory.write.setTreeAndSelectedPath(result.tree, result.treePath);
}
