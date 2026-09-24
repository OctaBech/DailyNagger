import { treeSelection } from "@/models/treeSelection";
import type { Tree, TreeNode, TreePath } from "@/models";
import { useCallback, useMemo } from "react";
import type { Memory } from "./useMemory";
import { startDebugRenderFrame } from "@/debug/render-frame";
import { treeOperations } from "@/services/tree-operations";
import type { EventEmitter } from "@/shared";
import type { MemoryEventType } from "./events";

/**
 * When a user action moves focus from one node to another, this wrapper removes
 * selection and focus properties from the path to the previously selected node,
 * then applies them to the path leading to the newly selected node.
 *
 * The updated tree and selected path are stored together, so actions cannot
 * accidentally update one without updating the other.
 */
export function useMemoryWithAutomatedSelectedPath(
  memory: Memory,
  debugName = "memory",
  memoryEvents?: EventEmitter<MemoryEventType, void>,
): Memory {
  const getSelectedPath = memory.read.getSelectedPath;
  const baseClear = memory.write.clear;
  const baseSetSelectedPath = memory.write.setSelectedPath;
  const baseSetTree = memory.write.setTree;
  const baseSetTreeWithoutSelectionRefresh = memory.write.setTreeWithoutSelectionRefresh;
  const baseSetTreeAndSelectedPath = memory.write.setTreeAndSelectedPath;

  const recordMemoryEvent = useCallback(
    (operation: MemoryEventType): void => {
      startDebugRenderFrame(`${debugName}.${operation}`);
      memoryEvents?.emit(operation, undefined);
    },
    [debugName, memoryEvents],
  );

  const clear = useCallback(() => {
    recordMemoryEvent("cleared");
    baseClear();
  }, [baseClear, recordMemoryEvent]);

  const setSelectedPath = useCallback(
    (path: TreePath) => {
      const tree = memory.read.tryGetTree();

      if (tree === null) {
        recordMemoryEvent("saved.selected.path");
        baseSetSelectedPath(path);
        return;
      }

      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("saved.selected.path");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [
      baseSetSelectedPath,
      baseSetTreeAndSelectedPath,
      getSelectedPath,
      memory.read,
      recordMemoryEvent,
    ],
  );

  const setTree = useCallback(
    (tree: Tree) => {
      const currentPath = getSelectedPath();
      const selectedNode = treeSelection.tryGetSelectedNode(currentPath);

      if (selectedNode === null) {
        recordMemoryEvent("saved.tree");
        baseSetTree(tree);
        return;
      }

      const result = trySetFocusPath(tree, selectedNode, true);

      if (result === null) {
        recordMemoryEvent("saved.tree");
        baseSetTreeAndSelectedPath(tree, []);
        return;
      }

      recordMemoryEvent("saved.tree");
      baseSetTreeAndSelectedPath(result.newTree, result.newPath);
    },
    [baseSetTree, baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
  );

  const setTreeWithoutSelectionRefresh = useCallback(
    (tree: Tree) => {
      recordMemoryEvent("saved.tree.without.selection.refresh");
      baseSetTreeWithoutSelectionRefresh(tree);
    },
    [baseSetTreeWithoutSelectionRefresh, recordMemoryEvent],
  );

  const setTreeAndSelectedPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("saved.tree.and.path");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
  );

  const setTreeAndFocusPath = useCallback(
    (tree: Tree, path: TreePath) => {
      const result = moveSelection(tree, getSelectedPath(), path);
      recordMemoryEvent("saved.tree.and.focus.path");
      baseSetTreeAndSelectedPath(result.tree, result.treePath);
    },
    [baseSetTreeAndSelectedPath, getSelectedPath, recordMemoryEvent],
  );

  const write = useMemo(() => {
    return {
      clear,
      setSelectedPath,
      setTree,
      setTreeWithoutSelectionRefresh,
      setTreeAndSelectedPath,
      setTreeAndFocusPath,
    };
  }, [
    clear,
    setSelectedPath,
    setTree,
    setTreeAndSelectedPath,
    setTreeAndFocusPath,
    setTreeWithoutSelectionRefresh,
  ]);

  return {
    ...memory,
    write,
  };
}

function moveSelection(
  tree: Tree,
  oldPath: TreePath,
  newPath: TreePath,
): { tree: Tree; treePath: TreePath } {
  const unselectedTree = clearSelectionFromFirstExistingPathNode(tree, oldPath);
  const selectedNode = treeSelection.tryGetSelectedNode(newPath);

  if (selectedNode === null) return { tree: unselectedTree, treePath: [] };

  const selected = trySetFocusPath(unselectedTree, selectedNode, true);
  if (selected === null) {
    throw new Error(
      `Cannot move selection because node type:${selectedNode.nodeType} could not be found in the target tree.`,
    );
  }

  return { tree: selected.newTree, treePath: selected.newPath };
}

function clearSelectionFromFirstExistingPathNode(tree: Tree, path: TreePath): Tree {
  // Paths run from the selected node toward the root. The first node that still
  // exists provides an entry point for clearing selection along that whole branch.
  for (const node of path) {
    const result = trySetFocusPath(tree, node, false);
    if (result !== null) return result.newTree;
  }

  return tree;
}

function trySetFocusPath(tree: Tree, node: TreeNode, hasFocus: boolean) {
  if (node.nodeType === "NagPlan") return null;

  try {
    return treeOperations.branch.setFocusPath(tree, node, hasFocus);
  } catch {
    return null;
  }
}
