import type { TreePath, Tree } from "@/models";
import type { Prettify } from "@/shared";
import { useCallback, useMemo, useState } from "react";
import { createStore, useStore } from "zustand";

type MemoryState = {
  readonly tree: Tree | null;
  readonly selectedPath: TreePath;
};

const freshMemoryState: MemoryState = {
  tree: null,
  selectedPath: [],
};

type MemoryWriteActions = {
  readonly clear: () => void;
  readonly setTree: (tree: Tree) => void;
  readonly setTreeWithoutSelectionRefresh: (tree: Tree) => void;
  readonly setSelectedPath: (path: TreePath) => void;
  readonly setTreeAndSelectedPath: (tree: Tree, path: TreePath) => void;
  readonly setTreeAndFocusPath: (tree: Tree, path: TreePath) => void;
};

type ZustandStore = MemoryState & MemoryWriteActions;

function createZustandStore() {
  return createStore<ZustandStore>((set) => {
    return {
      ...freshMemoryState,
      clear() {
        set((_state) => ({ ...freshMemoryState }));
      },
      setTree(tree: Tree) {
        set((_state) => ({ tree }));
      },
      setTreeWithoutSelectionRefresh(tree: Tree) {
        set((_state) => ({ tree }));
      },
      setSelectedPath(path: TreePath) {
        set(() => ({
          selectedPath: path,
        }));
      },
      setTreeAndSelectedPath(tree: Tree, path: TreePath) {
        set(() => ({
          tree,
          selectedPath: path,
        }));
      },
      setTreeAndFocusPath(tree: Tree, path: TreePath) {
        set(() => ({
          tree,
          selectedPath: path,
        }));
      },
    };
  });
}

export type Memory = Prettify<ReturnType<typeof useMemory>>;

export const useMemory = () => {
  const [zustandStore] = useState(() => createZustandStore());

  const { tree, selectedPath } = useStore(zustandStore);

  const clear = useCallback(() => {
    zustandStore.getState().clear();
  }, [zustandStore]);

  const getTree = useCallback(() => {
    const tree = zustandStore.getState().tree;
    if (tree === null) {
      throw new Error("Cannot read missing tree.");
    }
    return tree;
  }, [zustandStore]);

  const tryGetTree = useCallback(() => {
    return zustandStore.getState().tree;
  }, [zustandStore]);

  const setTree = useCallback(
    (tree: Tree) => {
      zustandStore.getState().setTree(tree);
    },
    [zustandStore],
  );

  const setTreeWithoutSelectionRefresh = useCallback(
    (tree: Tree) => {
      zustandStore.getState().setTreeWithoutSelectionRefresh(tree);
    },
    [zustandStore],
  );

  const getSelectedPath = useCallback(() => {
    return zustandStore.getState().selectedPath;
  }, [zustandStore]);

  const setSelectedPath = useCallback(
    (path: TreePath) => {
      zustandStore.getState().setSelectedPath(path);
    },
    [zustandStore],
  );

  const setTreeAndSelectedPath = useCallback(
    (tree: Tree, path: TreePath) => {
      zustandStore.getState().setTreeAndSelectedPath(tree, path);
    },
    [zustandStore],
  );

  const setTreeAndFocusPath = useCallback(
    (tree: Tree, path: TreePath) => {
      zustandStore.getState().setTreeAndFocusPath(tree, path);
    },
    [zustandStore],
  );

  return useMemo(() => {
    return {
      state: { tree, selectedPath },
      read: { getTree, tryGetTree, getSelectedPath },
      write: {
        clear,
        setTreeAndSelectedPath,
        setTreeAndFocusPath,
        setTree,
        setTreeWithoutSelectionRefresh,
        setSelectedPath,
      },
    };
  }, [
    clear,
    tree,
    selectedPath,
    getTree,
    tryGetTree,
    getSelectedPath,
    setTreeAndSelectedPath,
    setTreeAndFocusPath,
    setTree,
    setTreeWithoutSelectionRefresh,
    setSelectedPath,
  ]);
};
