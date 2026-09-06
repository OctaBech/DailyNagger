import { useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { Guid } from "@/shared";
import { useScreenPositionHandoff } from "./useScreenPositionHandoff";

export function ScreenPositionHandoffDebug() {
  const handoff = useScreenPositionHandoff();
  const snapshot = useSyncExternalStore(
    handoff.debug.subscribe,
    handoff.debug.getSnapshot,
    handoff.debug.getSnapshot,
  );

  return (
    <View pointerEvents="none" style={styles.debugPanel}>
      <Text style={styles.debugTitle}>offset</Text>
      <Text style={styles.debugText}>
        plan: {formatGuid(snapshot.plan.naggerId)} {formatNumber(snapshot.plan.scrollY)} /{" "}
        {formatNullable(snapshot.plan.naggerTopY)}
      </Text>
      <Text style={styles.debugText}>
        editor: {formatGuid(snapshot.editor.naggerId)} {formatNumber(snapshot.editor.scrollY)} /{" "}
        {formatNullable(snapshot.editor.naggerTopY)}
      </Text>
      <Text style={styles.debugText}>
        editor place:{" "}
        {snapshot.editorPlacement === null
          ? "-"
          : `${formatGuid(snapshot.editorPlacement.naggerId)} top ${formatNumber(
              snapshot.editorPlacement.sourceTopY,
            )} fill ${formatNumber(snapshot.editorPlacement.topFillerHeight)} scroll ${formatNumber(
              snapshot.editorPlacement.initialScrollY,
            )}`}
      </Text>
      <Text style={styles.debugText}>
        plan place:{" "}
        {snapshot.planPlacement === null
          ? "-"
          : `${formatGuid(snapshot.planPlacement.naggerId)} src ${formatNumber(
              snapshot.planPlacement.sourceTopY,
            )} dst ${formatNumber(snapshot.planPlacement.destinationTopY)} scroll ${formatNumber(
              snapshot.planPlacement.nextScrollY,
            )}`}
      </Text>
    </View>
  );
}

function formatNullable(value: number | null): string {
  return value === null ? "-" : formatNumber(value);
}

function formatNumber(value: number): string {
  return value.toFixed(1);
}

function formatGuid(value: Guid | null): string {
  return value === null ? "-" : value.slice(0, 8);
}

const styles = StyleSheet.create({
  debugPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    borderRadius: 6,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: "absolute",
    top: 72,
    zIndex: 100,
  },
  debugText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  debugTitle: {
    color: "#f1d56b",
    fontSize: 12,
    fontWeight: "900",
  },
});
