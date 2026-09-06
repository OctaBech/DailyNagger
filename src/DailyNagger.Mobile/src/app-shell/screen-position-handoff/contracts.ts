import type { Guid } from "@/shared";
import type { ScreenPositionWriter } from "./ScreenPositionTracker";

export type ScreenName = "plan" | "editor";

export type ScreenPositionHandoff = {
  readonly plan: ScreenPositionWriter;
  readonly editor: ScreenPositionWriter;
  readonly readEditorPlacement: (naggerId: Guid) => EditorPlacement | null;
  readonly readPlanPlacement: (naggerId: Guid, currentTopY: number) => PlanPlacement | null;
  readonly markEditorPlacementApplied: (placement: EditorPlacement) => void;
  readonly markPlanPlacementApplied: (placement: PlanPlacement) => void;
  readonly debug: ScreenPositionDebugStore;
};

export type EditorPlacement = {
  readonly naggerId: Guid;
  readonly sourceTopY: number;
  readonly topFillerHeight: number;
  readonly initialScrollY: number;
};

export type PlanPlacement = {
  readonly naggerId: Guid;
  readonly sourceTopY: number;
  readonly destinationTopY: number;
  readonly currentScrollY: number;
  readonly nextScrollY: number;
};

export type ScreenPositionDebugSnapshot = {
  readonly plan: ScreenPositionDebugScreen;
  readonly editor: ScreenPositionDebugScreen;
  readonly editorPlacement: EditorPlacement | null;
  readonly planPlacement: PlanPlacement | null;
};

export type ScreenPositionDebugScreen = {
  readonly scrollY: number;
  readonly naggerId: Guid | null;
  readonly naggerTopY: number | null;
};

export type ScreenPositionDebugStore = {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => ScreenPositionDebugSnapshot;
};

export type InternalScreenPositionDebugStore = ScreenPositionDebugStore & {
  readonly setScrollY: (screen: ScreenName, scrollY: number) => void;
  readonly setNaggerTopY: (screen: ScreenName, naggerId: Guid, topY: number) => void;
  readonly setEditorPlacement: (placement: EditorPlacement) => void;
  readonly setPlanPlacement: (placement: PlanPlacement) => void;
};
