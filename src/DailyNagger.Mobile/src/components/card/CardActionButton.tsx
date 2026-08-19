import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type CardActionButtonProps = {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onPress: () => void;
};

export const CardActionButton = ({
  accessibilityLabel,
  children,
  onPress,
}: CardActionButtonProps) => {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressedButton]}
    >
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: nagPlanTheme.taskLog.background,
    borderColor: nagPlanTheme.selection.border,
    borderRadius: nagPlanTheme.radius.control,
    borderWidth: 1,
    flexDirection: "row",
    gap: 2,
    height: 28,
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 5,
  },
  pressedButton: {
    backgroundColor: nagPlanTheme.taskItem.pressedBackground,
  },
});
