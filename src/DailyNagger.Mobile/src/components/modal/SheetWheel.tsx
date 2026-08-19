import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { modalTheme } from "./theme";

type SheetWheelOption<TValue extends string | number> = {
  readonly label: string;
  readonly value: TValue;
};

type SheetWheelProps<TValue extends string | number> = {
  readonly label?: string;
  readonly options: readonly SheetWheelOption<TValue>[];
  readonly orientation?: "horizontal" | "vertical";
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
};

export function SheetWheel<TValue extends string | number>({
  label,
  options,
  orientation = "vertical",
  value,
  onChange,
}: SheetWheelProps<TValue>) {
  const listRef = useRef<FlatList<SheetWheelOption<TValue>>>(null);
  const [wheelViewportSize, setWheelViewportSize] = useState(0);
  const isHorizontal = orientation === "horizontal";
  const activeItemSize = isHorizontal ? horizontalItemSize : itemSize;
  const horizontalSelectionOffset = isHorizontal ? modalTheme.sheet.contentPaddingHorizontal : 0;
  const horizontalEndPadding =
    wheelViewportSize === 0
      ? centerPadding
      : Math.max(0, wheelViewportSize - activeItemSize - horizontalSelectionOffset);
  const selectedIndex = useMemo(() => {
    const optionIndex = options.findIndex((option) => option.value === value);

    return optionIndex === -1 ? 0 : optionIndex;
  }, [options, value]);

  const scrollToOptionIndex = useCallback((optionIndex: number, animated: boolean): void => {
    listRef.current?.scrollToOffset({
      animated,
      offset: optionIndex * activeItemSize,
    });
  }, [activeItemSize]);

  useEffect(() => {
    scrollToOptionIndex(selectedIndex, false);
  }, [scrollToOptionIndex, selectedIndex]);

  function selectOptionFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    const offset = isHorizontal ? event.nativeEvent.contentOffset.x : event.nativeEvent.contentOffset.y;
    const optionIndex = Math.round(offset / activeItemSize);

    selectOptionAtIndex(optionIndex, false);
  }

  function selectOptionAtIndex(optionIndex: number, animated: boolean): void {
    const option = options[optionIndex];

    if (option === undefined) return;

    scrollToOptionIndex(optionIndex, animated);

    if (option.value !== value) {
      onChange(option.value);
    }
  }

  function updateWheelViewportSize(event: LayoutChangeEvent): void {
    const nextViewportSize = isHorizontal ? event.nativeEvent.layout.width : event.nativeEvent.layout.height;

    setWheelViewportSize(nextViewportSize);
  }

  return (
    <View style={[styles.root, isHorizontal && styles.horizontalRoot]}>
      {label === undefined ? null : (
        <Text selectable={false} style={styles.wheelLabel}>
          {label}
        </Text>
      )}
      <View
        onLayout={updateWheelViewportSize}
        style={[styles.wheel, isHorizontal ? styles.horizontalWheel : styles.verticalWheel]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.marker,
            isHorizontal
              ? [styles.horizontalMarker, { left: horizontalSelectionOffset }]
              : styles.verticalMarker,
          ]}
        />
        <FlatList
          ref={listRef}
          contentContainerStyle={
            isHorizontal
              ? { paddingLeft: horizontalSelectionOffset, paddingRight: horizontalEndPadding }
              : styles.verticalContent
          }
          data={options}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            index,
            length: activeItemSize,
            offset: activeItemSize * index,
          })}
          horizontal={isHorizontal}
          keyExtractor={(option) => String(option.value)}
          onMomentumScrollEnd={selectOptionFromScroll}
          renderItem={({ item, index }) => (
            <WheelItem
              isHorizontal={isHorizontal}
              isSelected={index === selectedIndex}
              label={item.label}
              onPress={() => selectOptionAtIndex(index, true)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          snapToInterval={activeItemSize}
        />
      </View>
    </View>
  );
}

function WheelItem({
  isHorizontal,
  isSelected,
  label,
  onPress,
}: {
  readonly isHorizontal: boolean;
  readonly isSelected: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.item, isHorizontal ? styles.horizontalItem : styles.verticalItem]}>
      {({ pressed }) => (
        <Text
          numberOfLines={1}
          selectable={false}
          style={[
            styles.label,
            isSelected ? styles.selectedLabel : styles.unselectedLabel,
            isSelected && styles.selectedWeight,
            pressed && styles.pressedLabel,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const itemSize = modalTheme.modalWheel.itemSize;
const horizontalItemSize = modalTheme.modalWheel.horizontalItemSize;
const wheelSize = modalTheme.modalWheel.itemSize * modalTheme.modalWheel.visibleItemCount;
const centerPadding = itemSize * Math.floor(modalTheme.modalWheel.visibleItemCount / 2);

const styles = StyleSheet.create({
  horizontalItem: {
    height: "100%",
    width: horizontalItemSize,
  },
  horizontalMarker: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    height: "100%",
    width: horizontalItemSize,
  },
  horizontalRoot: {
    marginHorizontal: -modalTheme.sheet.contentPaddingHorizontal,
  },
  horizontalWheel: {
    height: itemSize,
    width: "100%",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  marker: {
    borderColor: modalTheme.modalWheel.bar,
    position: "absolute",
    zIndex: 1,
  },
  pressedLabel: {
    opacity: 0.72,
  },
  root: {
    gap: 2,
  },
  selectedLabel: {
    color: modalTheme.modalWheel.selectedText,
  },
  selectedWeight: {
    fontSize: 16,
    fontWeight: "900",
  },
  unselectedLabel: {
    color: modalTheme.modalWheel.text,
  },
  verticalContent: {
    paddingVertical: centerPadding,
  },
  verticalItem: {
    height: itemSize,
    width: "100%",
  },
  verticalMarker: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    height: itemSize,
    top: centerPadding,
    width: "100%",
  },
  verticalWheel: {
    height: wheelSize,
    width: "100%",
  },
  wheel: {
    overflow: "hidden",
    position: "relative",
  },
  wheelLabel: {
    color: modalTheme.modalWheel.labelText,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: modalTheme.sheet.contentPaddingHorizontal,
    textAlign: "left",
  },
});
