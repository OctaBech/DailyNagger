import { StyleSheet, Text, View } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

export function DateSectionHeader({ title }: { readonly title: string }) {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: nagPlanTheme.rail.active,
  },
  title: {
    color: nagPlanTheme.nagger.titleText,
    fontSize: 18,
    fontWeight: "900",
  },
});
