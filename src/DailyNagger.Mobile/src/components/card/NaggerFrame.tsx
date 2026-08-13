import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

export type NaggerFrameTone =
  | "active"
  | "selected"
  | "completed"
  | "completedSelected";

type NaggerFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly isPinned?: boolean;
  readonly onRailPress?: () => void;
  readonly tone: NaggerFrameTone;
};

export const NaggerFrame = ({
  children,
  isPinned = false,
  onRailPress,
  tone,
}: NaggerFrameProps) => {
  const isCompleted = tone === "completed" || tone === "completedSelected";

  return (
    <View
      style={[
        styles.card,
        toneStyles[tone],
        (tone === "selected" || tone === "completedSelected") && styles.selectedFrame,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select nagger"
        onPress={onRailPress}
        style={[
          styles.statusLane,
          { backgroundColor: isCompleted ? nagPlanTheme.rail.completed : nagPlanTheme.rail.active },
        ]}
      />
      {isPinned ? (
        <View style={styles.pinMarker}>
          <View style={styles.pinHead} />
          <View style={styles.pinNeedle} />
        </View>
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: nagPlanTheme.radius.card,
    borderBottomWidth: nagPlanTheme.cardChrome.borderBottomWidth,
    borderLeftWidth: nagPlanTheme.cardChrome.borderLeftWidth,
    borderRightWidth: nagPlanTheme.cardChrome.borderRightWidth,
    borderTopWidth: nagPlanTheme.cardChrome.borderTopWidth,
    flexDirection: "row",
    gap: nagPlanTheme.rail.contentGap,
    overflow: "hidden",
    position: "relative",
  },
  content: {
    flex: 1,
    paddingBottom: nagPlanTheme.cardDensity.naggerPadding,
    paddingRight: nagPlanTheme.cardDensity.naggerPadding,
    paddingTop: nagPlanTheme.cardDensity.naggerPadding,
  },
  pinMarker: {
    alignItems: "center",
    height: 38,
    justifyContent: "center",
    left: "50%",
    marginLeft: -10,
    position: "absolute",
    top: -20,
    transform: [{ rotate: "-16deg" }],
    width: 20,
    zIndex: 2,
  },
  pinHead: {
    backgroundColor: "#b9322f",
    borderColor: "#7f1d1a",
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    width: 18,
  },
  pinNeedle: {
    backgroundColor: "#2f2424",
    height: 22,
    marginTop: -2,
    width: 3,
  },
  selectedFrame: {
    borderColor: nagPlanTheme.selection.border,
  },
  statusLane: {
    width: nagPlanTheme.rail.statusLaneWidth,
  },
});

const toneStyles = StyleSheet.create({
  active: {
    backgroundColor: nagPlanTheme.nagger.background,
    borderColor: nagPlanTheme.nagger.border,
  },
  selected: {
    backgroundColor: nagPlanTheme.nagger.selectedBackground,
    borderColor: nagPlanTheme.nagger.border,
  },
  completed: {
    backgroundColor: nagPlanTheme.nagger.completedBackground,
    borderColor: nagPlanTheme.nagger.completedBorder,
  },
  completedSelected: {
    backgroundColor: nagPlanTheme.nagger.completedSelectedBackground,
    borderColor: nagPlanTheme.nagger.completedBorder,
  },
} satisfies Record<NaggerFrameTone, ViewStyle>);
