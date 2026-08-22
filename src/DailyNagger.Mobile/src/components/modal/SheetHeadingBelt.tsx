import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { LayoutChangeEvent } from "react-native";
import { modalTheme } from "./theme";
import { SheetHeadline } from "./SheetHeadline";

type SheetHeadingBeltOption<TValue extends string> = {
  readonly label: string;
  readonly value: TValue;
};

type SheetHeadingBeltProps<TValue extends string> = {
  readonly options: readonly SheetHeadingBeltOption<TValue>[];
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
};

type ItemLayout = {
  readonly x: number;
};

export function SheetHeadingBelt<TValue extends string>({
  options,
  value,
  onChange,
}: SheetHeadingBeltProps<TValue>) {
  const scrollViewRef = useRef<ScrollView>(null);
  const itemLayoutsRef = useRef(new Map<TValue, ItemLayout>());
  const [viewportWidth, setViewportWidth] = useState(0);
  const selectedIndex = useMemo(() => {
    const optionIndex = options.findIndex((option) => option.value === value);

    return optionIndex === -1 ? 0 : optionIndex;
  }, [options, value]);

  const scrollToOption = useCallback(
    (option: SheetHeadingBeltOption<TValue>, animated: boolean): void => {
      const itemLayout = itemLayoutsRef.current.get(option.value);

      if (itemLayout === undefined) return;

      scrollViewRef.current?.scrollTo({
        animated,
        x: Math.max(0, itemLayout.x - modalTheme.sheet.contentPaddingHorizontal),
      });
    },
    [],
  );

  useEffect(() => {
    const selectedOption = options[selectedIndex];

    if (selectedOption === undefined) return;

    scrollToOption(selectedOption, false);
  }, [options, scrollToOption, selectedIndex]);

  function selectOption(option: SheetHeadingBeltOption<TValue>): void {
    scrollToOption(option, true);

    if (option.value !== value) {
      onChange(option.value);
    }
  }

  function setItemLayout(option: SheetHeadingBeltOption<TValue>, event: LayoutChangeEvent): void {
    itemLayoutsRef.current.set(option.value, {
      x: event.nativeEvent.layout.x,
    });
  }

  function setViewportLayout(event: LayoutChangeEvent): void {
    setViewportWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={setViewportLayout} style={styles.root}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.content,
          {
            paddingLeft: modalTheme.sheet.contentPaddingHorizontal,
            paddingRight: Math.max(modalTheme.modalHeadingBelt.endPadding, viewportWidth),
          },
        ]}
        decelerationRate="fast"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option, index) => (
          <HeadingBeltItem
            isSelected={index === selectedIndex}
            key={option.value}
            label={option.label}
            onLayout={(event) => setItemLayout(option, event)}
            onPress={() => selectOption(option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function HeadingBeltItem({
  isSelected,
  label,
  onLayout,
  onPress,
}: {
  readonly isSelected: boolean;
  readonly label: string;
  readonly onLayout: (event: LayoutChangeEvent) => void;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onLayout={onLayout}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <SheetHeadline text={label} tone={isSelected ? "active" : "inactive"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: modalTheme.modalHeadingBelt.gap,
  },
  item: {
    paddingHorizontal: modalTheme.modalHeadingBelt.itemPaddingHorizontal,
  },
  pressed: {
    opacity: 0.72,
  },
  root: {
    marginHorizontal: -modalTheme.sheet.contentPaddingHorizontal,
    width: "100%",
  },
});
