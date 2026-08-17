import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { modalTheme } from "./theme";

type SheetWheelOption<TValue extends string | number> = {
  readonly label: string;
  readonly value: TValue;
};

type SheetWheelProps<TValue extends string | number> = {
  readonly label?: string;
  readonly markedValues?: readonly TValue[];
  readonly options: readonly SheetWheelOption<TValue>[];
  readonly orientation?: "horizontal" | "vertical";
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
};

export function SheetWheel<TValue extends string | number>({
  label,
  markedValues = [],
  options,
  orientation = "vertical",
  value,
  onChange,
}: SheetWheelProps<TValue>) {
  const listRef = useRef<FlatList<SheetWheelOption<TValue>>>(null);
  const [wheelViewportSize, setWheelViewportSize] = useState(0);
  const isHorizontal = orientation === "horizontal";
  const horizontalSelectionOffset =
    wheelViewportSize === 0
      ? itemSize * modalTheme.modalWheel.horizontalLeadingItemCount
      : Math.min(
          itemSize * modalTheme.modalWheel.horizontalLeadingItemCount,
          Math.max(0, wheelViewportSize - itemSize),
        );
  const horizontalEndPadding =
    wheelViewportSize === 0 ? centerPadding : Math.max(0, wheelViewportSize - itemSize - horizontalSelectionOffset);
  const markedValueSet = useMemo(() => new Set(markedValues), [markedValues]);
  const selectedIndex = useMemo(() => {
    const optionIndex = options.findIndex((option) => option.value === value);

    return optionIndex === -1 ? 0 : optionIndex;
  }, [options, value]);

  useEffect(() => {
    scrollToOptionIndex(selectedIndex, false);
  }, [selectedIndex]);

  function scrollToOptionIndex(optionIndex: number, animated: boolean): void {
    listRef.current?.scrollToOffset({
      animated,
      offset: optionIndex * modalTheme.modalWheel.itemSize,
    });
  }

  function selectOptionFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>): void {
    const offset = isHorizontal ? event.nativeEvent.contentOffset.x : event.nativeEvent.contentOffset.y;
    const optionIndex = Math.round(offset / modalTheme.modalWheel.itemSize);

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
    <View style={styles.root}>
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
            length: modalTheme.modalWheel.itemSize,
            offset: modalTheme.modalWheel.itemSize * index,
          })}
          horizontal={isHorizontal}
          keyExtractor={(option) => String(option.value)}
          onMomentumScrollEnd={selectOptionFromScroll}
          renderItem={({ item, index }) => (
            <WheelItem
              isHorizontal={isHorizontal}
              isMarked={markedValueSet.has(item.value)}
              isSelected={index === selectedIndex}
              label={item.label}
              onPress={() => selectOptionAtIndex(index, true)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          snapToInterval={modalTheme.modalWheel.itemSize}
        />
      </View>
    </View>
  );
}

function WheelItem({
  isHorizontal,
  isMarked,
  isSelected,
  label,
  onPress,
}: {
  readonly isHorizontal: boolean;
  readonly isMarked: boolean;
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
            isMarked && styles.markedLabel,
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
const wheelSize = modalTheme.modalWheel.itemSize * modalTheme.modalWheel.visibleItemCount;
const centerPadding = itemSize * Math.floor(modalTheme.modalWheel.visibleItemCount / 2);

const styles = StyleSheet.create({
  horizontalItem: {
    height: "100%",
    width: itemSize,
  },
  horizontalMarker: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    height: "100%",
    width: itemSize,
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
  markedLabel: {
    color: modalTheme.modalWheel.markedText,
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
    textAlign: "left",
  },
});
