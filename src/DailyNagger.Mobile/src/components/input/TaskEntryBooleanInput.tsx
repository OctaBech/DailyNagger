import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import {
  editableFrame,
  inactiveEditableFrame,
} from "@/components/primitives/editableFrame";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TaskEntryBooleanInputProps = {
  checked: boolean;
  referenceChecked?: boolean;
  label?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  showEditFrame?: boolean;
};

export const TaskEntryBooleanInput = ({
  checked,
  referenceChecked = false,
  label,
  onPress,
  style,
  compact = false,
  showEditFrame = false,
}: TaskEntryBooleanInputProps) => {
  return (
    <Pressable
      hitSlop={8}
      onPress={onPress}
      style={[inactiveEditableFrame, styles.container, style, showEditFrame && editableFrame]}
    >
      {label !== undefined && (
        <Text selectable={false} style={[styles.label, referenceChecked && styles.referenceLabel]}>
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
  referenceLabel: {
    color: nagPlanTheme.taskEntry.referenceText,
  },
  checkbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
    borderRadius: editableFrame.borderRadius,
    borderWidth: 4,
    height: 34,
    width: 34,
  },
  compactCheckbox: {
    backgroundColor: nagPlanTheme.taskEntry.checkboxBackground,
    borderColor: nagPlanTheme.taskEntry.checkboxBorder,
    borderRadius: editableFrame.borderRadius,
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
