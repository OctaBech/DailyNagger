import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { usePlanScreenActions } from "@/services";
import { modelName } from "expo-device";
import { demoEditorUserId, getActiveUserId } from "@/config/activeUserId";

export function DemoDataControls() {
  const { demo } = usePlanScreenActions();
  const hasTriggered = useRef(false);
  const [disabled, setDisabled] = useState(false);
  const [isEditingDemo, setIsEditingDemo] = useState(() => getActiveUserId() === demoEditorUserId);

  function runOnce(action: () => void) {
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    setDisabled(true);
    action();
  }

  return (
    <View style={[styles.controls, disabled && styles.disabled]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => runOnce(() => demo.addData(undefined))}
        onLongPress={
          modelName === "SM-G770F"
            ? () => {
                demo.switchUser(undefined);
                setIsEditingDemo(getActiveUserId() === demoEditorUserId);
              }
            : undefined
        }
        style={[styles.button, isEditingDemo && styles.editorButton]}
      >
        <Text style={styles.label}>
          {isEditingDemo ? "Demo editor · Add demo data" : "Add demo data"}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onLongPress={() => runOnce(() => demo.deleteAllData(undefined))}
        style={[styles.button, isEditingDemo && styles.editorButton]}
      >
        <Text style={styles.label}>Hold to delete all data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { gap: 8, paddingVertical: 8 },
  button: { borderRadius: 10, backgroundColor: "#d97828", padding: 12 },
  editorButton: { backgroundColor: "#f2d66f" },
  label: { color: "#1a1b1d", fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.5 },
});
