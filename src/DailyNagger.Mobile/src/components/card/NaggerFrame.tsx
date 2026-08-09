import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { nagPlanTheme } from "@/features/nag-plan/theme";
import { FocusFrame } from "./FocusFrame";

export type NaggerFrameTone =
  | "active"
  | "selected"
  | "completed"
  | "completedSelected";

type NaggerFrameProps = {
  readonly children: ReactNode;
  readonly hasFocus?: boolean;
  readonly isPinned?: boolean;
  readonly tone: NaggerFrameTone;
};

export const NaggerFrame = ({
  children,
  hasFocus = false,
  isPinned = false,
  tone,
}: NaggerFrameProps) => {
  return (
    <View
      style={[
        styles.card,
        toneStyles[tone],
        (tone === "selected" || tone === "completedSelected") && styles.selectedFrame,
      ]}
    >
      {hasFocus ? <FocusFrame radius={nagPlanTheme.radius.card} /> : null}
      {isPinned ? (
        <View style={styles.pinMarker}>
          <View style={styles.pinHead} />
          <View style={styles.pinNeedle} />
        </View>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: nagPlanTheme.radius.card,
    borderWidth: 1,
    padding: nagPlanTheme.cardDensity.padding,
    position: "relative",
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
    shadowColor: "#1b1010",
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 0.28,
    shadowRadius: 1,
    width: 18,
    elevation: 2,
  },
  pinNeedle: {
    backgroundColor: "#2f2424",
    height: 22,
    marginTop: -2,
    width: 3,
  },
  selectedFrame: {
    borderColor: nagPlanTheme.selection.border,
    shadowColor: nagPlanTheme.selection.shadow,
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 2,
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
    padding: nagPlanTheme.cardDensity.padding,
  },
  completedSelected: {
    backgroundColor: nagPlanTheme.nagger.completedSelectedBackground,
    borderColor: nagPlanTheme.nagger.completedBorder,
    padding: nagPlanTheme.cardDensity.padding,
  },
} satisfies Record<NaggerFrameTone, ViewStyle>);
