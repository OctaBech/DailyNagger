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
    justifyContent: "center",
    minHeight: 24,
    minWidth: 48,
    paddingHorizontal: 8,
  },
});
