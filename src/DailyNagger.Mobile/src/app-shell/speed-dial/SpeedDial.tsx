import { useEffect, useState } from "react";
import { FAB, Portal } from "react-native-paper";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { actionButtonTheme } from "@/components/primitives/actionButtonTheme";
import { appLayout, appTiming } from "@/config";
import type { SpeedDialMenu, SpeedDialMenuItem } from "@/services";

type SpeedDialProps = {
  readonly menu: SpeedDialMenu;
};

type PaperSpeedDialAction = Omit<SpeedDialMenuItem, "keepOpenAfterPress" | "onSelect"> & {
  readonly onPress: () => void;
};

export const SpeedDial = ({ menu }: SpeedDialProps) => {
  const { bottom } = useSafeAreaInsets();
  const [state, setState] = useState<{ open: boolean }>({ open: false });
  const [showLabels, setShowLabels] = useState(false);

  const { open } = state;
  const bottomOffset = Math.max(appLayout.speedDial.bottom, bottom + 12);
  const actionGridBottom = bottomOffset + appLayout.speedDial.actionGridGap;
  const paperSpeedDialActions = menu.items.map(({ keepOpenAfterPress, onSelect, ...action }) => ({
    ...action,
    onPress: () => {
      if (action.isDisabled === true) return;
      onSelect();
      if (keepOpenAfterPress !== true) close();
    },
  }));

  const close = () => {
    setShowLabels(false);
    setState({ open: false });
  };
  const toggleOpen = () => {
    setShowLabels(false);
    setState(({ open }) => ({ open: !open }));
  };
  const actionRows = groupSpeedDialActions(paperSpeedDialActions);

  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(
      () => setShowLabels(true),
      appTiming.speedDial.hesitationAssistDelayMs,
    );
    return () => clearTimeout(timeoutId);
  }, [open]);

  return (
    <Portal>
      {menu.items.length > 0 ? (
        <View pointerEvents="box-none" style={styles.portalRoot}>
          {open ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close speed dial"
              onPress={close}
              style={styles.dismissLayer}
            />
          ) : null}

          {open ? (
            <View pointerEvents="box-none" style={[styles.actionsGrid, { bottom: actionGridBottom }]}>
              {actionRows.map((row) => (
                <View key={row.key} style={styles.actionRow}>
                  {row.actions.map((action) => (
                    <View
                      key={action.key}
                      style={[
                        styles.actionChip,
                        action.isDisabled === true ? styles.disabledActionChip : null,
                      ]}
                    >
                      {showLabels && action.showLabel === true ? (
                        <Text selectable={false} numberOfLines={1} style={styles.actionLabel}>
                          {action.label}
                        </Text>
                      ) : null}
                      <FAB
                        color={actionButtonTheme.icon}
                        icon={action.icon}
                        disabled={action.isDisabled}
                        onPress={action.onPress}
                        size="small"
                        style={styles.actionButton}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}

          <FAB
            color={actionButtonTheme.icon}
            icon={open ? "close" : "plus"}
            onPress={toggleOpen}
            style={[styles.mainButton, { bottom: bottomOffset }]}
          />
        </View>
      ) : null}
    </Portal>
  );
};

export default SpeedDial;

function groupSpeedDialActions<TAction extends PaperSpeedDialAction>(actions: readonly TAction[]) {
  const rows = new Map<number, TAction[]>();

  actions.forEach((action, index) => {
    const row = action.row ?? index;
    rows.set(row, [...(rows.get(row) ?? []), action]);
  });

  return [...rows.entries()]
    .sort(([left], [right]) => right - left)
    .map(([row, rowActions]) => ({ key: String(row), actions: rowActions }));
}

const styles = StyleSheet.create({
  portalRoot: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  dismissLayer: {
    backgroundColor: "transparent",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  actionsGrid: {
    alignItems: "flex-end",
    gap: 12,
    maxWidth: 360,
    position: "absolute",
    right: appLayout.speedDial.right,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  actionChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  disabledActionChip: {
    opacity: 0.38,
  },
  actionLabel: {
    backgroundColor: "#121416",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 132,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButton: {
    backgroundColor: actionButtonTheme.background,
  },
  mainButton: {
    backgroundColor: actionButtonTheme.background,
    position: "absolute",
    right: appLayout.speedDial.right,
  },
});
