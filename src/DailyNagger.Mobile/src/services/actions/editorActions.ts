import { NodeTemplates } from "@/services/core-node-templates";
import { selectedNodeContextOperations } from "@/services/core-node-operations";
import { selectedPathOperations } from "@/services/core-tree-operations";
import { editorOperations, inputOperations } from "@/services/operations";
import type { Memory } from "../memory";

type EditorActionScope = {
  readonly memory: Memory;
};

type MoveDirection = "up" | "down";

export function editorTaskEntryAdd({ memory }: EditorActionScope): void {
  const currentPath = memory.read.getSelectedPath();
  const { taskLog, taskItem } = selectedPathOperations.deriveSelectedNodes(currentPath);

  if (taskLog === null) return;
  if (taskItem === null) return;

  const newTaskEntry = NodeTemplates.getTaskEntry(taskLog, taskItem);

  const currentTree = memory.read.getTree();

  const treeWithNewTaskEntry = editorOperations.addTaskEntryToTaskItem(
    currentTree,
    taskItem,
    newTaskEntry,
  );

  memory.write.setTree(treeWithNewTaskEntry);
}

export function editorTaskItemAdd({ memory }: EditorActionScope): void {
  const currentPath = memory.read.getSelectedPath();
  const { taskLog, taskItem } = selectedPathOperations.deriveSelectedNodes(currentPath);

  if (taskLog === null) {
    throw new Error("Cannot add TaskItem because no TaskLog is selected in editor memory.");
  }

  const newTaskItem = NodeTemplates.getTaskItem(taskLog, taskItem);
  const currentTree = memory.read.getTree();

  const treeWithNewTaskItem =
    taskItem !== null
      ? editorOperations.addTaskItemToTaskItem(currentTree, taskItem, newTaskItem)
      : editorOperations.addTaskItemToTaskLog(currentTree, taskLog, newTaskItem);

  const treeWithUpdatedDescendantCount = editorOperations.updateDescendantTaskItemCount(
    treeWithNewTaskItem,
    currentPath,
    +1,
  );

  memory.write.setTree(treeWithUpdatedDescendantCount);
}

export function editorMoveSelectedNodeUp(scope: EditorActionScope): void {
  moveSelectedNode(scope, "up");
}

export function editorMoveSelectedNodeDown(scope: EditorActionScope): void {
  moveSelectedNode(scope, "down");
}

function moveSelectedNode({ memory }: EditorActionScope, direction: MoveDirection): void {
  const currentPath = memory.read.getSelectedPath();
  const moveContext = selectedNodeContextOperations.tryReadMoveContext(currentPath);

  if (moveContext === null) return;
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

export function editorDeleteSelectedNode({ memory }: EditorActionScope): void {
  const currentPath = memory.read.getSelectedPath();
  const deleteContext = selectedNodeContextOperations.tryReadDeleteContext(currentPath);

  if (deleteContext === null) return;

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

  const treeWithDoneCountAdjusted =
    deleteContext.selectedNode.isDone === false
      ? currentTree
      : inputOperations.updateDoneDescendantTaskItemCount(currentTree, currentPath, -1);

  const treeWithReducedTaskItemDoneCount = editorOperations.updateDescendantTaskItemCount(
    treeWithDoneCountAdjusted,
    currentPath,
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
