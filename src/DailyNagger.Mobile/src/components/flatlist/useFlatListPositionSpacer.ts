import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

type FlatListPositionSpacer = {
  readonly footerHeight: number;
  readonly headerHeight: number;
  readonly initialScrollY: number;
};

export function useFlatListPositionSpacer(topY: number | null): FlatListPositionSpacer {
  const { height: screenHeight } = useWindowDimensions();

  return useMemo(() => {
    if (topY === null) {
      return {
        footerHeight: screenHeight,
        headerHeight: 0,
        initialScrollY: 0,
      };
    }

    return {
      footerHeight: screenHeight,
      headerHeight: topY > 0 ? topY : 0,
      initialScrollY: topY < 0 ? -topY : 0,
    };
  }, [screenHeight, topY]);
}
