import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export type StateScreenAction = {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly kind?: "primary" | "secondary";
};

export type StateScreenProps = {
  readonly title: string;
  readonly message: string;
  readonly detail?: string;
  readonly warning?: string | null;
  readonly showSpinner?: boolean;
  readonly primaryAction?: StateScreenAction;
  readonly secondaryAction?: StateScreenAction;
};

export function StateScreen({
  title,
  message,
  detail,
  warning,
  showSpinner = false,
  primaryAction,
  secondaryAction,
}: StateScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.screen}>
      {warning !== null && warning !== undefined && (
        <View style={styles.warning}>
          <Text selectable={false} style={styles.warningText}>
            {warning}
          </Text>
        </View>
      )}
      <View style={styles.content}>
        <Text selectable={false} style={styles.title}>
          {title}
        </Text>
        <Text selectable={false} style={styles.message}>
          {message}
        </Text>
        {showSpinner && <ActivityIndicator color={stateScreenColors.accent} size="large" />}
        {detail !== undefined && (
          <Text selectable style={styles.detail}>
            {detail}
          </Text>
        )}
        <View style={styles.actions}>
          {primaryAction !== undefined && <StateScreenButton action={primaryAction} />}
          {secondaryAction !== undefined && <StateScreenButton action={secondaryAction} />}
        </View>
      </View>
    </ScrollView>
  );
}

function StateScreenButton({ action }: { readonly action: StateScreenAction }) {
  const kind = action.kind ?? "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.button,
        kind === "secondary" ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        selectable={false}
        style={kind === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText}
      >
        {action.label}
      </Text>
    </Pressable>
  );
}

const stateScreenColors = {
  background: "#1a1b1d",
  surface: "#26292c",
  text: "#f4f1ed",
  mutedText: "#eef2f3",
  accent: "#d97828",
} as const;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: stateScreenColors.background,
    flexGrow: 1,
  },
  content: {
    alignItems: "flex-start",
    gap: 16,
    padding: 24,
  },
  title: {
    color: stateScreenColors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  message: {
    color: stateScreenColors.text,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  detail: {
    backgroundColor: stateScreenColors.surface,
    borderColor: stateScreenColors.accent,
    borderRadius: 6,
    borderWidth: 1,
    color: stateScreenColors.mutedText,
    fontSize: 13,
    padding: 12,
  },
  warning: {
    borderColor: stateScreenColors.accent,
    borderRadius: 6,
    borderWidth: 1,
    margin: 24,
    marginBottom: 0,
    padding: 12,
  },
  warningText: {
    color: stateScreenColors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  actions: {
    alignItems: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  primaryButton: {
    backgroundColor: stateScreenColors.accent,
  },
  primaryButtonText: {
    color: stateScreenColors.background,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: stateScreenColors.accent,
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: stateScreenColors.text,
    fontSize: 16,
    fontWeight: "900",
  },
});
