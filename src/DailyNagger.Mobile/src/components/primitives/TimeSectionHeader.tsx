import { StyleSheet, Text, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

type TimeSectionHeaderProps = {
  readonly title: string;
  readonly rangeLabel: string;
};

export function TimeSectionHeader({ rangeLabel, title }: TimeSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.range}>{rangeLabel}</Text>
      </View>
      <View style={styles.underline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    marginBottom: 2,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  labelRow: {
    alignItems: "baseline",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: nagPlanTheme.screen.text,
    fontSize: 15,
    fontWeight: "900",
  },
  range: {
    color: "#aeb8bd",
    fontSize: 12,
    fontWeight: "800",
  },
  underline: {
    backgroundColor: "#3e464d",
    height: 1,
    marginTop: 4,
    width: 120,
  },
});
