import { createContext, useContext, useState, type ReactNode } from "react";
import type { Guid } from "@/shared";

type ScreenName = "plan" | "editor";

type ScreenPositionHandoff = {
  readonly plan: ScreenPositionWriter;
  readonly editor: ScreenPositionWriter;
  readonly readEditorPlacement: (naggerId: Guid) => EditorPlacement | null;
  readonly readPlanPlacement: (naggerId: Guid, currentTopY: number) => PlanPlacement | null;
  readonly markEditorPlacementApplied: (placement: EditorPlacement) => void;
  readonly markPlanPlacementApplied: (placement: PlanPlacement) => void;
  readonly debug: ScreenPositionDebugStore;
};

type ScreenPositionWriter = {
  readonly setScrollY: (scrollY: number) => void;
  readonly setNaggerTopY: (naggerId: Guid, topY: number) => void;
};

type EditorPlacement = {
  readonly naggerId: Guid;
  readonly sourceTopY: number;
  readonly topFillerHeight: number;
  readonly initialScrollY: number;
};

type PlanPlacement = {
  readonly naggerId: Guid;
  readonly sourceTopY: number;
  readonly destinationTopY: number;
  readonly currentScrollY: number;
  readonly nextScrollY: number;
};

type ScreenPositionState = {
  scrollY: number;
  naggerId: Guid | null;
  naggerTopY: number | null;
};

export type ScreenPositionDebugSnapshot = {
  readonly plan: ScreenPositionDebugScreen;
  readonly editor: ScreenPositionDebugScreen;
  readonly editorPlacement: EditorPlacement | null;
  readonly planPlacement: PlanPlacement | null;
};

type ScreenPositionDebugScreen = {
  readonly scrollY: number;
  readonly naggerId: Guid | null;
  readonly naggerTopY: number | null;
};

export type ScreenPositionDebugStore = {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => ScreenPositionDebugSnapshot;
};

const ScreenPositionHandoffContext = createContext<ScreenPositionHandoff | null>(null);

type ScreenPositionHandoffProviderProps = {
  readonly children: ReactNode;
};

export function ScreenPositionHandoffProvider({ children }: ScreenPositionHandoffProviderProps) {
  const [handoff] = useState(createScreenPositionHandoff);

  return (
    <ScreenPositionHandoffContext.Provider value={handoff}>
      {children}
    </ScreenPositionHandoffContext.Provider>
  );
}

export function useScreenPositionHandoff(): ScreenPositionHandoff {
  const handoff = useContext(ScreenPositionHandoffContext);

  if (handoff === null) {
    throw new Error("ScreenPositionHandoffContext is missing.");
  }

  return handoff;
}

function createScreenPositionHandoff(): ScreenPositionHandoff {
  const plan = createScreenPositionState();
  const editor = createScreenPositionState();
  const debug = createScreenPositionDebugStore();

  return {
    plan: createScreenPositionWriter("plan", plan, debug),
    editor: createScreenPositionWriter("editor", editor, debug),
    readEditorPlacement: (naggerId) => {
      if (plan.naggerId !== naggerId || plan.naggerTopY === null) return null;

      return createEditorPlacement(naggerId, plan.naggerTopY);
    },
    readPlanPlacement: (naggerId, currentTopY) => {
      if (editor.naggerId !== naggerId || editor.naggerTopY === null) return null;

      return createPlanPlacement(naggerId, editor.naggerTopY, currentTopY, plan.scrollY);
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

function createScreenPositionState(): ScreenPositionState {
  return {
    scrollY: 0,
    naggerId: null,
    naggerTopY: null,
  };
}

function createScreenPositionWriter(
  screen: ScreenName,
  state: ScreenPositionState,
  debug: InternalScreenPositionDebugStore,
): ScreenPositionWriter {
  return {
    setScrollY: (scrollY) => {
      state.scrollY = scrollY;
      debug.setScrollY(screen, scrollY);
    },
    setNaggerTopY: (naggerId, topY) => {
      state.naggerId = naggerId;
      state.naggerTopY = topY;
      debug.setNaggerTopY(screen, naggerId, topY);
    },
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

type InternalScreenPositionDebugStore = ScreenPositionDebugStore & {
  readonly setScrollY: (screen: ScreenName, scrollY: number) => void;
  readonly setNaggerTopY: (screen: ScreenName, naggerId: Guid, topY: number) => void;
  readonly setEditorPlacement: (placement: EditorPlacement) => void;
  readonly setPlanPlacement: (placement: PlanPlacement) => void;
};

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
