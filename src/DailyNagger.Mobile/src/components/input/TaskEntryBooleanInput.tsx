import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskEntryBooleanInputProps = {
  checked: boolean;
  referenceChecked?: boolean;
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export const TaskEntryBooleanInput = ({
  checked,
  referenceChecked = false,
  label,
  onPress,
  style,
  compact = false,
}: TaskEntryBooleanInputProps) => {
  return (
    <Pressable hitSlop={8} onPress={onPress} style={[styles.container, style]}>
      {label !== undefined && (
        <Text selectable={false} style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          compact ? styles.compactCheckbox : styles.checkbox,
          referenceChecked && styles.referenceCheckbox,
          checked && styles.checkedCheckbox,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
  },
  label: {
    color: nagPlanTheme.taskEntry.inputText,
    fontSize: 15,
    fontWeight: "700",
  },
  checkbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
    borderRadius: nagPlanTheme.radius.checkbox,
    borderWidth: 4,
    height: 34,
    width: 34,
  },
  compactCheckbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
    borderRadius: 5,
    borderWidth: 3,
    height: 24,
    width: 24,
  },
  referenceCheckbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxReferenceBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
  },
  checkedCheckbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxCheckedBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
  },
});
