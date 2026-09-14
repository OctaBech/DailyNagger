import { StyleSheet, View } from "react-native";
import { StateScreen, type StateScreenProps } from "@/components/primitives";

type SendingPromptOverlayProps = {
  readonly prompt: StateScreenProps | null;
};

export function SendingPromptOverlay({ prompt }: SendingPromptOverlayProps) {
  if (prompt === null) return null;

  return (
    <View style={styles.overlay}>
      <StateScreen {...prompt} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 30,
  },
});
