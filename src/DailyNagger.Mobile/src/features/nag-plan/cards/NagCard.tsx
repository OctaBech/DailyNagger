import { memo } from "react";
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

type RailTone = "active" | "completed";

const NagCardComponent = ({ nagger }: NagCardProps) => {
  useDebugRenderFrameCounter("PlanNaggerCard", nagger.id);

  const { setExpanded, setFocused } = usePlanScreenCommands().nagger;

  const isTaskLogCompleted = isCompletedTaskLog(nagger.taskLog);
  const hasTaskItems = nagger.taskLog.descendantTaskItemCount > 0;
  const tone = getNaggerCardTone(nagger.clientProps.isSelected, isTaskLogCompleted);
  const railTone = getRailTone(isTaskLogCompleted);

  return (
    <View style={styles.naggerGroup}>
      <Card.NaggerFrame
        hasFocus={nagger.clientProps.hasFocus}
        hasTaskItems={hasTaskItems}
        isPinned={nagger.pinnedBy !== "None"}
        onRailPress={() => setFocused(nagger)}
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
      </Card.NaggerFrame>

      {nagger.clientProps.isExpanded ? (
        <View style={styles.taskLogPanel}>
          <TaskLogCard
            key={nagger.taskLog.id}
            taskLog={nagger.taskLog}
            parentNaggerHasFocus={nagger.clientProps.hasFocus}
            railTone={railTone}
          />
        </View>
      ) : null}
    </View>
  );
};

export const NagCard = memo(NagCardComponent);

function isCompletedTaskLog(taskLog: Nagger["taskLog"]): boolean {
  return (
    taskLog.descendantTaskItemCount > 0 &&
    taskLog.doneDescendantTaskItemCount === taskLog.descendantTaskItemCount
  );
}

function getNaggerCardTone(isSelected: boolean, isCompleted: boolean): NaggerFrameTone {
  if (isSelected && isCompleted) return "completedSelected";
  if (isCompleted) return "completed";
  if (isSelected) return "selected";
  return "active";
}

function getRailTone(isCompleted: boolean): RailTone {
  return isCompleted ? "completed" : "active";
}

const styles = StyleSheet.create({
  naggerGroup: {
    backgroundColor: "transparent",
  },
  taskLogPanel: {
    backgroundColor: "transparent",
    gap: nagPlanTheme.cardDensity.fieldGap,
  },
});
