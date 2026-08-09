import { StyleSheet, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { ProgressCount } from "./ProgressCount";

type ProgressPillProps = {
  readonly done: number;
  readonly total: number;
};

export const ProgressPill = ({ done, total }: ProgressPillProps) => {
  return (
    <View style={styles.pill}>
      <ProgressCount
        color={nagPlanTheme.taskItem.progressText}
        done={done}
        hideWhenEmpty={false}
        total={total}
        weight="800"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    backgroundColor: "#f4f1ed",
    borderColor: "rgba(95, 53, 25, 0.24)",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 24,
    minWidth: 48,
    paddingHorizontal: 8,
    shadowColor: "#2b180c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
