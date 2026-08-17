import { StyleSheet, View } from "react-native";
import { Activity, memo, useState } from "react";
import { type Nagger } from "@/models";
import { useEditorScreenCommands, useEditorScreenData } from "@/services";
import { TaskLogCard } from "./TaskLogCard";
import { nagPlanTheme } from "../theme";
import { Card, Modal } from "@/components";
import type { NaggerFrameTone } from "@/components/card";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type NagCardProps = {
  nagger: Nagger;
};

type RailTone = "active" | "completed";

const NagCardComponent = ({ nagger }: NagCardProps) => {
  const { nagger: naggerActions } = useEditorScreenCommands();
  const { schedule } = useEditorScreenData();
  useDebugRenderFrameCounter("EditorNaggerCard", nagger.id);

  const isExpanded = nagger.clientProps?.isExpanded ?? false;
  const isSelected = nagger.clientProps.isSelected;
  const isTaskLogCompleted = isCompletedTaskLog(nagger.taskLog);
  const hasTaskItems = nagger.taskLog.descendantTaskItemCount > 0;
  const tone = getNaggerCardTone(isSelected, isTaskLogCompleted);
  const railTone = getRailTone(isTaskLogCompleted);
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isTargetTimeModalVisible, setIsTargetTimeModalVisible] = useState(false);

  return (
    <>
      <View style={styles.naggerGroup}>
        <Card.NaggerFrame
          hasTaskItems={hasTaskItems}
          hasFocus={nagger.clientProps.hasFocus}
          isPinned={nagger.pinnedBy !== "None"}
          onRailPress={() => naggerActions.setFocused(nagger)}
          tone={tone}
        >
          <Card.NaggerField
            nagger={nagger}
            isExpanded={isExpanded}
            isCompleted={isTaskLogCompleted}
            allowEditSchedule
            allowEditTargetTime
            allowEditTitle
            isSchedulePickerOpen={isScheduleModalVisible}
            isTargetTimePickerOpen={isTargetTimeModalVisible}
            showComponentOutlines
            onFocus={() => naggerActions.setFocused(nagger)}
            onTitleCommit={(title) => naggerActions.setTitle(nagger, title)}
            onSchedulePress={() => setIsScheduleModalVisible(true)}
            onTargetTimePress={() => setIsTargetTimeModalVisible(true)}
            onHeaderPress={() => {
              naggerActions.setExpanded(nagger, !isExpanded);
            }}
            onExpandPress={() => {
              naggerActions.setExpanded(nagger, !isExpanded);
            }}
          />
        </Card.NaggerFrame>

        <Activity mode={isExpanded ? "visible" : "hidden"}>
          <View style={styles.taskLogPanel}>
            <TaskLogCard
              key={nagger.taskLog.id}
              taskLog={nagger.taskLog}
              parentNaggerHasFocus={nagger.clientProps.hasFocus}
              railTone={railTone}
            />
          </View>
        </Activity>
      </View>

      <Modal.NaggerScheduleModal
        visible={isScheduleModalVisible}
        nagger={nagger}
        getPreviewDueOn={(scheduleRules) => schedule.getNextDueOn(nagger, scheduleRules)}
        onDismiss={() => setIsScheduleModalVisible(false)}
        onDone={(scheduleRules) => {
          naggerActions.setScheduleRules(nagger, scheduleRules);
          setIsScheduleModalVisible(false);
        }}
      />

      <Modal.NaggerTargetTimeModal
        visible={isTargetTimeModalVisible}
        targetTime={nagger.targetTime}
        onDismiss={() => setIsTargetTimeModalVisible(false)}
        onClear={() => {
          naggerActions.setTargetTime(nagger, null);
          setIsTargetTimeModalVisible(false);
        }}
        onDone={(targetTime) => {
          naggerActions.setTargetTime(nagger, targetTime);
          setIsTargetTimeModalVisible(false);
        }}
      />
    </>
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
  if (isCompleted) return isSelected ? "completedSelected" : "completed";
  return isSelected ? "selected" : "active";
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
