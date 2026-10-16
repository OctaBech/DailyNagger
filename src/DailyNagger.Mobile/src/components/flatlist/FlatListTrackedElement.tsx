import { useCallback, useRef, type ReactNode } from "react";
import { View } from "react-native";

type FlatListTrackedElementProps = {
  readonly children: ReactNode;
  readonly onMeasured?: (topY: number, height: number) => void;
};

export function FlatListTrackedElement({ children, onMeasured }: FlatListTrackedElementProps) {
  const elementRef = useRef<View>(null);

  const measure = useCallback(() => {
    if (onMeasured === undefined) return;

    elementRef.current?.measureInWindow((_x, topY, _width, height) => {
      onMeasured(topY, height);
    });
  }, [onMeasured]);

  return (
    <View ref={elementRef} collapsable={false} onLayout={measure}>
      {children}
    </View>
  );
}
