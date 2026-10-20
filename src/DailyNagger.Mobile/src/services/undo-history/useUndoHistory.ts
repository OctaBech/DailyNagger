import type { Prettify } from "@/shared";
import { useState } from "react";
import { createStore } from "zustand";

type UndoHistoryState<TChange> = {
  readonly undoStack: readonly TChange[];
  readonly redoStack: readonly TChange[];
};

type UndoHistoryStore<TChange> = UndoHistoryState<TChange> & {
  readonly record: (change: TChange) => void;
  readonly undo: (currentState: TChange) => TChange;
  readonly redo: (currentState: TChange) => TChange;
  readonly canUndo: () => boolean;
  readonly canRedo: () => boolean;
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
    undo(currentState: TChange) {
      const change = get().undoStack.at(-1);

      if (change === undefined) throw new Error("Cannot undo: undo history is empty.");

      set((state) => ({
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, currentState],
      }));

      return change;
    },
    redo(currentState: TChange) {
      const change = get().redoStack.at(-1);

      if (change === undefined) throw new Error("Cannot redo: redo history is empty.");

      set((state) => ({
        undoStack: [...state.undoStack, currentState],
        redoStack: state.redoStack.slice(0, -1),
      }));

      return change;
    },
    canUndo() {
      return get().undoStack.length > 0;
    },
    canRedo() {
      return get().redoStack.length > 0;
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

  const { record, undo, redo, canUndo, canRedo, clear } = historyStore.getState();

  return {
    record,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}

export type UndoHistory<TChange> = Prettify<ReturnType<typeof useUndoHistory<TChange>>>;
