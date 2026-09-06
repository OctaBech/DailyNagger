import { useCallback, useRef, type ReactNode } from "react";
import { View } from "react-native";

type FlatListTrackedElementProps = {
  readonly children: ReactNode;
  readonly onMeasured?: (topY: number) => void;
};

export function FlatListTrackedElement({ children, onMeasured }: FlatListTrackedElementProps) {
  const elementRef = useRef<View>(null);

  const measure = useCallback(() => {
    if (onMeasured === undefined) return;

    elementRef.current?.measureInWindow((_x, topY) => {
      onMeasured(topY);
    });
  }, [onMeasured]);

  return (
    <View ref={elementRef} collapsable={false} onLayout={measure}>
      {children}
    </View>
  );
}
