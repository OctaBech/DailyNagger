import { StyleSheet, View } from "react-native";
import { Activity, memo, useState } from "react";
import { type Nagger } from "@/models";
import { useEditorScreenCommands, useEditorScreenData } from "@/services";
import { TaskLogCard } from "./TaskLogCard";
import { nagPlanTheme } from "../theme";
import { Card, Modal } from "@/components";
import { useDebugRenderFrameCounter } from "@/debug/render-frame";

type NagCardProps = {
  nagger: Nagger;
};

const NagCardComponent = ({ nagger }: NagCardProps) => {
  const { nagger: naggerActions } = useEditorScreenCommands();
  const { schedule } = useEditorScreenData();
  useDebugRenderFrameCounter("EditorNaggerCard", nagger.id);

  const isExpanded = nagger.clientProps?.isExpanded ?? false;
  const isSelected = nagger.clientProps.isSelected;
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isTargetTimeModalVisible, setIsTargetTimeModalVisible] = useState(false);

  return (
    <>
      <Card.NaggerFrame
        hasFocus={nagger.clientProps.hasFocus}
        isPinned={nagger.pinnedBy !== "None"}
        tone={isSelected ? "selected" : "active"}
      >
        <Card.NaggerField
          nagger={nagger}
          isExpanded={isExpanded}
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

        <Activity mode={isExpanded ? "visible" : "hidden"}>
          <View style={styles.taskLogPanel}>
            <TaskLogCard key={nagger.taskLog.id} taskLog={nagger.taskLog} />
          </View>
        </Activity>
      </Card.NaggerFrame>

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

const styles = StyleSheet.create({
  taskLogPanel: {
    backgroundColor: "transparent",
    borderRadius: nagPlanTheme.radius.card,
    gap: nagPlanTheme.spacing.taskLog,
    paddingTop: 8,
  },
});
