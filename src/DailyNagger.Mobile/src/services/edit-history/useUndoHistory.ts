import type { Prettify } from "@/shared";
import { useCallback, useState } from "react";
import { createStore, useStore } from "zustand";

type UndoHistoryState<TChange> = {
  readonly undoStack: readonly TChange[];
  readonly redoStack: readonly TChange[];
};

type UndoHistoryStore<TChange> = UndoHistoryState<TChange> & {
  readonly record: (change: TChange) => void;
  readonly undo: () => TChange | null;
  readonly redo: () => TChange | null;
  readonly clear: () => void;
};

function createUndoHistoryStore<TChange>() {
  return createStore<UndoHistoryStore<TChange>>((set, get) => ({
    undoStack: [],
    redoStack: [],
    record(change: TChange) {
      set((state) => ({
        undoStack: [...state.undoStack, change],
        redoStack: [],
      }));
    },
    undo() {
      const change = get().undoStack.at(-1);

      if (change === undefined) return null;

      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, change],
      }));

      return change;
    },
    redo() {
      const change = get().redoStack.at(-1);

      if (change === undefined) return null;

      set((state) => ({
        undoStack: [...state.undoStack, change],
        redoStack: state.redoStack.slice(0, -1),
      }));

      return change;
    },
    clear() {
      set({
        undoStack: [],
        redoStack: [],
      });
    },
  }));
}

export function useUndoHistory<TChange>() {
  const [historyStore] = useState(() => createUndoHistoryStore<TChange>());
  const { undoStack, redoStack } = useStore(historyStore);

  const record = useCallback(
    (change: TChange) => {
      historyStore.getState().record(change);
    },
    [historyStore],
  );

  const undo = useCallback(() => {
    return historyStore.getState().undo();
  }, [historyStore]);

  const redo = useCallback(() => {
    return historyStore.getState().redo();
  }, [historyStore]);

  const clear = useCallback(() => {
    historyStore.getState().clear();
  }, [historyStore]);

  return {
    state: {
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      hasChanges: undoStack.length > 0,
    },
    record,
    undo,
    redo,
    clear,
  };
}

export type UndoHistory<TChange> = Prettify<ReturnType<typeof useUndoHistory<TChange>>>;
