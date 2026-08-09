import { Activity, memo } from "react";
import { StyleSheet, View } from "react-native";
import { type Nagger } from "@/models";
import { Card } from "@/components";
import type { NaggerFrameTone } from "@/components/card";
import { usePlanScreenCommands } from "@/services";
import { TaskLogCard } from "./TaskLogCard";
import { nagPlanTheme } from "../theme";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type NagCardProps = {
  readonly nagger: Nagger;
};

const NagCardComponent = ({ nagger }: NagCardProps) => {
  useDebugRenderFrameCounter("PlanNaggerCard", nagger.id);

  const { setExpanded, setFocused } = usePlanScreenCommands().nagger;

  const isTaskLogCompleted = isCompletedTaskLog(nagger.taskLog);
  const tone = getNaggerCardTone(nagger.clientProps.isSelected, isTaskLogCompleted);

  return (
    <Card.NaggerFrame
      hasFocus={nagger.clientProps.hasFocus}
      isPinned={nagger.pinnedBy !== "None"}
      tone={tone}
    >
      <Card.NaggerField
        nagger={nagger}
        isExpanded={nagger.clientProps.isExpanded}
        isCompleted={isTaskLogCompleted}
        allowEditSchedule={false}
        allowEditTitle={false}
        showComponentOutlines={false}
        onFocus={() => setFocused(nagger)}
        onHeaderPress={() => {
          setExpanded(nagger, !nagger.clientProps.isExpanded);
        }}
        onExpandPress={() => {
          setExpanded(nagger, !nagger.clientProps.isExpanded);
        }}
      />

      <Activity mode={nagger.clientProps.isExpanded ? "visible" : "hidden"}>
        <View style={styles.taskLogPanel}>
          <TaskLogCard key={nagger.taskLog.id} taskLog={nagger.taskLog} />
        </View>
      </Activity>
    </Card.NaggerFrame>
  );
};

export const NagCard = memo(NagCardComponent);

function isCompletedTaskLog(taskLog: Nagger["taskLog"]): boolean {
  return (
    taskLog.descendantTaskItemCount > 0 &&
    taskLog.doneDescendantTaskItemCount === taskLog.descendantTaskItemCount
  );
}

function getNaggerCardTone(
  isSelected: boolean,
  isCompleted: boolean,
): NaggerFrameTone {
  if (isSelected && isCompleted) return "completedSelected";
  if (isCompleted) return "completed";
  if (isSelected) return "selected";
  return "active";
}

const styles = StyleSheet.create({
  taskLogPanel: {
    backgroundColor: "transparent",
    borderRadius: nagPlanTheme.radius.card,
    gap: nagPlanTheme.cardDensity.fieldGap,
    paddingTop: nagPlanTheme.cardDensity.padding,
  },
});
