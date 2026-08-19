import { Pressable, StyleSheet, Text, View } from "react-native";
import { modalTheme } from "./theme";

type SheetSegmentedControlOption<TValue extends string> = {
  readonly label: string;
  readonly value: TValue;
};

type SheetSegmentedControlProps<TValue extends string> = {
  readonly options: readonly SheetSegmentedControlOption<TValue>[];
  readonly orientation?: "horizontal" | "vertical";
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
};

export function SheetSegmentedControl<TValue extends string>({
  options,
  orientation = "horizontal",
  value,
  onChange,
}: SheetSegmentedControlProps<TValue>) {
  const isVertical = orientation === "vertical";
  const selectedValue = options.length === 1 ? options[0]?.value : value;

  return (
    <View style={[styles.container, isVertical ? styles.vertical : styles.horizontal]}>
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              isVertical ? styles.verticalSegment : styles.horizontalSegment,
              isSelected ? styles.selectedSegment : styles.unselectedSegment,
              isVertical && !isFirst && styles.verticalSharedBorder,
              !isVertical && !isFirst && styles.horizontalSharedBorder,
              getSegmentRadiusStyle({ isFirst, isLast, isVertical }),
              pressed && styles.pressedSegment,
            ]}
          >
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              selectable={false}
              style={[styles.label, isSelected ? styles.selectedLabel : styles.unselectedLabel]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function getSegmentRadiusStyle({
  isFirst,
  isLast,
  isVertical,
}: {
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly isVertical: boolean;
}) {
  if (isVertical) {
    return [
      isFirst && styles.firstVerticalSegment,
      isLast && styles.lastVerticalSegment,
      !isFirst && !isLast && styles.middleSegment,
    ];
  }

  return [
    isFirst && styles.firstHorizontalSegment,
    isLast && styles.lastHorizontalSegment,
    !isFirst && !isLast && styles.middleSegment,
  ];
}

const styles = StyleSheet.create({
  container: {
    alignItems: "stretch",
  },
  firstHorizontalSegment: {
    borderBottomLeftRadius: modalTheme.modalSegmentedControl.borderRadius,
    borderTopLeftRadius: modalTheme.modalSegmentedControl.borderRadius,
  },
  firstVerticalSegment: {
    borderTopLeftRadius: modalTheme.modalSegmentedControl.borderRadius,
    borderTopRightRadius: modalTheme.modalSegmentedControl.borderRadius,
  },
  horizontal: {
    flexDirection: "row",
  },
  horizontalSegment: {
    flexGrow: 0,
    flexShrink: 0,
    minWidth: 48,
  },
  horizontalSharedBorder: {
    marginLeft: -1,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    includeFontPadding: false,
  },
  lastHorizontalSegment: {
    borderBottomRightRadius: modalTheme.modalSegmentedControl.borderRadius,
    borderTopRightRadius: modalTheme.modalSegmentedControl.borderRadius,
  },
  lastVerticalSegment: {
    borderBottomLeftRadius: modalTheme.modalSegmentedControl.borderRadius,
    borderBottomRightRadius: modalTheme.modalSegmentedControl.borderRadius,
  },
  middleSegment: {
    borderRadius: 0,
  },
  pressedSegment: {
    opacity: 0.72,
  },
  segment: {
    alignItems: "center",
    borderColor: modalTheme.modalSegmentedControl.border,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: modalTheme.modalSegmentedControl.minHeight,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  selectedLabel: {
    color: modalTheme.modalSegmentedControl.selectedText,
  },
  selectedSegment: {
    backgroundColor: modalTheme.modalSegmentedControl.selectedBackground,
    borderColor: modalTheme.modalSegmentedControl.selectedBorder,
    zIndex: 1,
  },
  unselectedLabel: {
    color: modalTheme.modalSegmentedControl.text,
  },
  unselectedSegment: {
    backgroundColor: modalTheme.modalSegmentedControl.unselectedBackground,
  },
  vertical: {
    flexDirection: "column",
  },
  verticalSegment: {
    alignSelf: "stretch",
  },
  verticalSharedBorder: {
    marginTop: -1,
  },
});
