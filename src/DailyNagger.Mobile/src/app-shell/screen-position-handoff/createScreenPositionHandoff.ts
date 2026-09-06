import type { Guid } from "@/shared";
import {
  type EditorPlacement,
  type InternalScreenPositionDebugStore,
  type PlanPlacement,
  type ScreenPositionDebugScreen,
  type ScreenPositionDebugSnapshot,
  type ScreenPositionHandoff,
} from "./contracts";
import { createScreenPositionTracker } from "./ScreenPositionTracker";

export function createScreenPositionHandoff(): ScreenPositionHandoff {
  const debug = createScreenPositionDebugStore();
  const plan = createScreenPositionTracker("plan", debug);
  const editor = createScreenPositionTracker("editor", debug);

  return {
    plan: plan.writer,
    editor: editor.writer,
    readEditorPlacement: (naggerId) => {
      const planSnapshot = plan.read();
      if (planSnapshot.naggerId !== naggerId || planSnapshot.naggerTopY === null) return null;

      return createEditorPlacement(naggerId, planSnapshot.naggerTopY);
    },
    readPlanPlacement: (naggerId, currentTopY) => {
      const editorSnapshot = editor.read();
      const planSnapshot = plan.read();
      if (editorSnapshot.naggerId !== naggerId || editorSnapshot.naggerTopY === null) return null;

      return createPlanPlacement(
        naggerId,
        editorSnapshot.naggerTopY,
        currentTopY,
        planSnapshot.scrollY,
      );
    },
    markEditorPlacementApplied: (placement) => {
      debug.setEditorPlacement(placement);
    },
    markPlanPlacementApplied: (placement) => {
      debug.setPlanPlacement(placement);
    },
    debug,
  };
}

function createEditorPlacement(naggerId: Guid, sourceTopY: number): EditorPlacement {
  return {
    naggerId,
    sourceTopY,
    topFillerHeight: sourceTopY > 0 ? sourceTopY : 0,
    initialScrollY: sourceTopY < 0 ? -sourceTopY : 0,
  };
}

function createPlanPlacement(
  naggerId: Guid,
  sourceTopY: number,
  destinationTopY: number,
  currentScrollY: number,
): PlanPlacement {
  return {
    naggerId,
    sourceTopY,
    destinationTopY,
    currentScrollY,
    nextScrollY: currentScrollY + destinationTopY - sourceTopY,
  };
}

function createScreenPositionDebugStore(): InternalScreenPositionDebugStore {
  let snapshot: ScreenPositionDebugSnapshot = {
    plan: createDebugScreen(),
    editor: createDebugScreen(),
    editorPlacement: null,
    planPlacement: null,
  };
  const listeners = new Set<() => void>();
  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    setScrollY: (screen, scrollY) => {
      snapshot = {
        ...snapshot,
        [screen]: { ...snapshot[screen], scrollY },
      };
      emit();
    },
    setNaggerTopY: (screen, naggerId, naggerTopY) => {
      snapshot = {
        ...snapshot,
        [screen]: { ...snapshot[screen], naggerId, naggerTopY },
      };
      emit();
    },
    setEditorPlacement: (editorPlacement) => {
      snapshot = { ...snapshot, editorPlacement };
      emit();
    },
    setPlanPlacement: (planPlacement) => {
      snapshot = { ...snapshot, planPlacement };
      emit();
    },
  };
}

function createDebugScreen(): ScreenPositionDebugScreen {
  return {
    scrollY: 0,
    naggerId: null,
    naggerTopY: null,
  };
}
