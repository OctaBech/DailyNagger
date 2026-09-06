import type { Guid } from "@/shared";
import type { InternalScreenPositionDebugStore, ScreenName } from "./useScreenPositionHandoff";

export type ScreenPositionWriter = {
  readonly setScrollY: (scrollY: number) => void;
  readonly setNaggerTopY: (naggerId: Guid, topY: number) => void;
};

export type ScreenPositionTracker = {
  readonly writer: ScreenPositionWriter;
  readonly read: () => ScreenPositionSnapshot;
};

export type ScreenPositionSnapshot = {
  readonly scrollY: number;
  readonly naggerId: Guid | null;
  readonly naggerTopY: number | null;
};

type ScreenPositionState = {
  scrollY: number;
  naggerId: Guid | null;
  naggerTopY: number | null;
};

export function createScreenPositionTracker(
  screen: ScreenName,
  debug: InternalScreenPositionDebugStore,
): ScreenPositionTracker {
  const state: ScreenPositionState = {
    scrollY: 0,
    naggerId: null,
    naggerTopY: null,
  };

  return {
    writer: {
      setScrollY: (scrollY) => {
        state.scrollY = scrollY;
        debug.setScrollY(screen, scrollY);
      },
      setNaggerTopY: (naggerId, topY) => {
        state.naggerId = naggerId;
        state.naggerTopY = topY;
        debug.setNaggerTopY(screen, naggerId, topY);
      },
    },
    read: () => state,
  };
}
