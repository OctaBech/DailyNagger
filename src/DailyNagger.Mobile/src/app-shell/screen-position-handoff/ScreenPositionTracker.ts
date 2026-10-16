import type { Guid } from "@/shared";
import type { InternalScreenPositionDebugStore, ScreenName } from "./contracts";

export type ScreenPositionWriter = {
  readonly setScrollY: (scrollY: number) => void;
  readonly setNaggerTopY: (naggerId: Guid, topY: number) => void;
};

export type ScreenPositionTracker = {
  readonly writer: ScreenPositionWriter;
  readonly read: (options?: { readonly reset?: boolean }) => ScreenPositionSnapshot;
};

export type ScreenPositionSnapshot = {
  readonly scrollY: number;
  readonly naggerId: Guid | null;
  readonly naggerTopY: number | null;
};

type ScreenPositionState = {
  scrollY: number;
  scrollYAtMeasurement: number;
  naggerId: Guid | null;
  naggerTopY: number | null;
};

export function createScreenPositionTracker(
  screen: ScreenName,
  debug: InternalScreenPositionDebugStore,
): ScreenPositionTracker {
  const state: ScreenPositionState = {
    scrollY: 0,
    scrollYAtMeasurement: 0,
    naggerId: null,
    naggerTopY: null,
  };

  const read: ScreenPositionTracker["read"] = (options) => {
    const snapshot: ScreenPositionSnapshot = {
      scrollY: state.scrollY,
      naggerId: state.naggerId,
      // Scrolling moves the card without triggering a new layout measurement.
      naggerTopY:
        state.naggerTopY === null
          ? null
          : state.naggerTopY - (state.scrollY - state.scrollYAtMeasurement),
    };

    if (options?.reset) {
      state.scrollY = 0;
      state.scrollYAtMeasurement = 0;
      state.naggerId = null;
      state.naggerTopY = null;
      debug.resetScreen(screen);
    }

    return snapshot;
  };

  return {
    writer: {
      setScrollY: (scrollY) => {
        state.scrollY = scrollY;
        debug.setScrollY(screen, scrollY);
        const snapshot = read();
        if (snapshot.naggerId !== null && snapshot.naggerTopY !== null) {
          debug.setNaggerTopY(screen, snapshot.naggerId, snapshot.naggerTopY);
        }
      },
      setNaggerTopY: (naggerId, topY) => {
        state.naggerId = naggerId;
        state.naggerTopY = topY;
        state.scrollYAtMeasurement = state.scrollY;
        debug.setNaggerTopY(screen, naggerId, topY);
      },
    },
    read,
  };
}
