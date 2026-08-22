import { Pressable, StyleSheet, Text, View } from "react-native";
import { modalTheme } from "./theme";

type SheetToggleGroupOption<TValue extends string> = {
  readonly label: string;
  readonly value: TValue;
};

type SheetToggleGroupProps<TValue extends string> = {
  readonly options: readonly SheetToggleGroupOption<TValue>[];
  readonly selectedValues: readonly TValue[];
  readonly onChange: (selectedValues: readonly TValue[]) => void;
};

export function SheetToggleGroup<TValue extends string>({
  options,
  selectedValues,
  onChange,
}: SheetToggleGroupProps<TValue>) {
  const selectedValueSet = new Set(selectedValues);

  function toggleValue(value: TValue): void {
    const nextSelectedValueSet = new Set(selectedValues);

    if (nextSelectedValueSet.has(value)) {
      nextSelectedValueSet.delete(value);
    } else {
      nextSelectedValueSet.add(value);
    }

    onChange(
      options
        .map((option) => option.value)
        .filter((optionValue) => nextSelectedValueSet.has(optionValue)),
    );
  }

  return (
    <View style={styles.group}>
      {options.map((option) => {
        const isSelected = selectedValueSet.has(option.value);

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => toggleValue(option.value)}
            style={({ pressed }) => [
              styles.toggle,
              isSelected ? styles.selectedToggle : styles.unselectedToggle,
              pressed && styles.pressedToggle,
            ]}
          >
            <Text
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

const styles = StyleSheet.create({
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: modalTheme.modalToggleGroup.gap,
  },
  label: {
    fontSize: 15,
    fontWeight: "800",
  },
  pressedToggle: {
    opacity: 0.72,
  },
  selectedLabel: {
    color: modalTheme.modalToggleGroup.selectedText,
  },
  selectedToggle: {
    backgroundColor: modalTheme.modalToggleGroup.selectedBackground,
    borderColor: modalTheme.modalToggleGroup.selectedBorder,
  },
  toggle: {
    alignItems: "center",
    borderRadius: modalTheme.modalToggleGroup.borderRadius,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: modalTheme.modalToggleGroup.minHeight,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  unselectedLabel: {
    color: modalTheme.modalToggleGroup.text,
  },
  unselectedToggle: {
    backgroundColor: modalTheme.modalToggleGroup.unselectedBackground,
    borderColor: modalTheme.modalToggleGroup.border,
  },
});
