import { SvgXml } from "react-native-svg";
import { thumbTackSvg } from "./assets/thumbTackSvg";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";

export type NaggerFrameTone = "active" | "selected" | "completed" | "completedSelected";

type NaggerFrameProps = {
  readonly children: ReactNode;
  readonly hasTaskItems?: boolean;
  readonly hasFocus?: boolean;
  readonly isPinned?: boolean;
  readonly onRailPress?: () => void;
  readonly tone: NaggerFrameTone;
};

export const NaggerFrame = ({
  children,
  hasTaskItems = true,
  isPinned = false,
  onRailPress,
  tone,
}: NaggerFrameProps) => {
  const isCompleted = tone === "completed" || tone === "completedSelected";
  const statusLaneColor = isCompleted
    ? nagPlanTheme.rail.completed
    : hasTaskItems
      ? nagPlanTheme.rail.active
      : nagPlanTheme.rail.empty;

  return (
    <View style={styles.frame}>
      <View style={[styles.card, toneStyles[tone], !hasTaskItems && styles.emptyTaskListCard]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select nagger"
          onPress={onRailPress}
          style={[styles.statusLane, { backgroundColor: statusLaneColor }]}
        />
        <View style={styles.content}>{children}</View>
      </View>
      {isPinned && (
        <View
          pointerEvents="none"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={styles.pinMarker}
        >
          <SvgXml xml={thumbTackSvg} width={36} height={34} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: { position: "relative" },
  card: {
    borderRadius: nagPlanTheme.radius.card,
    borderWidth: nagPlanTheme.nagger.borderWidth,
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
    position: "absolute",
    left: "50%",
    marginLeft: -18,
    top: -10,
    width: 36,
    height: 34,
    zIndex: 2,
  },
  statusLane: {
    width: nagPlanTheme.rail.statusLaneWidth,
  },
  emptyTaskListCard: {
    backgroundColor: nagPlanTheme.nagger.background,
  },
});

const toneStyles = StyleSheet.create({
  active: {
    backgroundColor: nagPlanTheme.nagger.activeBackground,
    borderColor: nagPlanTheme.nagger.border,
  },
  selected: {
    backgroundColor: nagPlanTheme.nagger.selectedBackground,
    borderColor: nagPlanTheme.selection.border,
  },
  completed: {
    backgroundColor: nagPlanTheme.nagger.completedBackground,
    borderColor: nagPlanTheme.nagger.completedBorder,
  },
  completedSelected: {
    backgroundColor: nagPlanTheme.nagger.completedSelectedBackground,
    borderColor: nagPlanTheme.selection.border,
  },
} satisfies Record<NaggerFrameTone, ViewStyle>);
