import { View, Text, StyleSheet } from "react-native";
import { nagPlanTheme } from "./theme";

export const Header = () => (
  <View>
    <Text selectable={false} style={styles.eyebrow}>
      DailyNagger
    </Text>
    <Text selectable={false} style={styles.title}>
      Dagens nagger
    </Text>
  </View>
);

const styles = StyleSheet.create({
  eyebrow: {
    color: nagPlanTheme.screen.accent,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: nagPlanTheme.screen.text,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 24,
  },
});
