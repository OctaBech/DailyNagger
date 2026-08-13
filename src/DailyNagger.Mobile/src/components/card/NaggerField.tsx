import { nagPlanTheme } from "@/features/nag-plan/theme";
import type { Nagger } from "@/models";
import * as Input from "@/components/input";
import * as Primitives from "@/components/primitives";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { cardRowLayout } from "./cardRowLayout";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

type NaggerFieldProps = {
  readonly nagger: Nagger;
  readonly isExpanded: boolean;
  readonly showComponentOutlines?: boolean;
  readonly allowEditTitle?: boolean;
  readonly allowEditSchedule?: boolean;
  readonly allowEditTargetTime?: boolean;
  readonly isSchedulePickerOpen?: boolean;
  readonly isTargetTimePickerOpen?: boolean;
  readonly isCompleted?: boolean;
  readonly allowExpand?: boolean;
  readonly onFocus?: () => void;
  readonly onTitleCommit?: (title: string) => void;
  readonly onSchedulePress?: () => void;
  readonly onTargetTimePress?: () => void;
  readonly onHeaderPress?: () => void;
  readonly onExpandPress: () => void;
};

export const NaggerField = (props: NaggerFieldProps) => {
  const {
    nagger,
    isExpanded,
    showComponentOutlines = false,
    allowEditTitle = false,
    allowEditSchedule = false,
    allowEditTargetTime = false,
    isSchedulePickerOpen = false,
    isTargetTimePickerOpen = false,
    isCompleted = false,
    allowExpand = true,
    onFocus,
    onTitleCommit,
    onSchedulePress,
    onTargetTimePress,
    onHeaderPress,
    onExpandPress,
  } = props;

  return (
    <View style={styles.field}>
      <View style={styles.titleRow}>
        {allowEditTitle ? (
          <View style={[cardRowLayout.textSlot, styles.titleInputArea]}>
            <Input.CommitTextInput
              mode="title"
              value={nagger.title}
              onCommit={(title) => onTitleCommit?.(title)}
              onFocus={onFocus}
              placeholder="Name the task"
              placeholderTextColor="#6b7c86"
              showEditFrame={showComponentOutlines}
              style={[cardRowLayout.textInput, styles.title]}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => {
              onFocus?.();
              if (allowExpand) onHeaderPress?.();
            }}
            style={[cardRowLayout.textSlot, styles.titlePressable]}
          >
            <Text
              selectable={false}
              style={[cardRowLayout.text, styles.title]}
            >
              {nagger.title}
            </Text>
          </Pressable>
        )}

        <Primitives.ProgressPill
          done={nagger.taskLog.doneDescendantTaskItemCount}
          total={nagger.taskLog.descendantTaskItemCount}
        />

        {allowExpand ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Expand nagger log"
            onPress={() => {
              onFocus?.();
              onExpandPress();
            }}
            style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
          >
            <Primitives.ExpandIndicator
              color={nagPlanTheme.taskItem.chevronText}
              hasExpandableContent
              isExpanded={isExpanded}
              size={28}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.scheduleRow}>
        <Pressable
          onPress={() => {
            onFocus?.();
            if (allowEditSchedule) {
              onSchedulePress?.();
              return;
            }

            if (allowExpand) onHeaderPress?.();
          }}
          style={({ pressed }) => [
            styles.schedule,
              isSchedulePickerOpen && styles.activeSchedule,
            pressed && styles.schedulePressed,
          ]}
        >
          <MaterialDesignIcons
            color={getScheduleColor(isCompleted)}
            name="calendar-clock"
            size={16}
          />
          <Text
            selectable={false}
            style={[
              styles.scheduleText,
              isCompleted && styles.completedScheduleText,
            ]}
          >
            {getNaggerScheduleText(nagger)}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Expand nagger log"
          onPress={() => {
            onFocus?.();
            if (allowExpand) onHeaderPress?.();
          }}
          style={({ pressed }) => [styles.scheduleSpacer, pressed && styles.schedulePressed]}
        />
      </View>

      {allowEditTargetTime || nagger.targetTime !== null ? (
        <View style={styles.targetTimeRow}>
          <Pressable
            accessibilityRole={allowEditTargetTime ? "button" : undefined}
            onPress={() => {
              onFocus?.();
              if (allowEditTargetTime) {
                onTargetTimePress?.();
                return;
              }

              if (allowExpand) onHeaderPress?.();
            }}
            style={({ pressed }) => [
              styles.targetTime,
              isTargetTimePickerOpen && styles.activeSchedule,
              pressed && styles.schedulePressed,
            ]}
          >
            <MaterialDesignIcons
              color={getScheduleColor(isCompleted)}
              name="clock-outline"
              size={16}
            />
            <Text
              selectable={false}
              style={[
                styles.scheduleText,
                isCompleted && styles.completedScheduleText,
              ]}
            >
              {getNaggerTargetTimeText(nagger)}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

function getNaggerScheduleText(nagger: Nagger): string {
  if (nagger.activeLogDueOn === null) {
    return "Due never";
  }

  return `Due ${nagger.activeLogDueOn}`;
}

function getNaggerTargetTimeText(nagger: Nagger): string {
  if (nagger.targetTime === null) {
    return "Any time";
  }

  const [hours, minutes] = nagger.targetTime.split(":");
  return `${hours}:${minutes}`;
}

function getScheduleColor(isCompleted: boolean): string {
  if (isCompleted) return nagPlanTheme.nagger.completedDueText;
  return nagPlanTheme.nagger.dueText;
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: nagPlanTheme.nagger.titleText,
    fontSize: 22,
    fontWeight: "800",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  titlePressable: {
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 30,
  },
  titleInputArea: {
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 30,
  },
  scheduleRow: {
    alignItems: "stretch",
    flexDirection: "row",
  },
  targetTimeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  expandButton: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: 32,
    paddingHorizontal: 2,
  },
  expandButtonPressed: {
    opacity: 0.72,
  },
  schedule: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: nagPlanTheme.radius.control,
    flexDirection: "row",
    gap: 5,
    paddingVertical: 2,
  },
  targetTime: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: nagPlanTheme.radius.control,
    flexDirection: "row",
    gap: 5,
    paddingVertical: 2,
  },
  scheduleSpacer: {
    flex: 1,
    minHeight: 30,
  },
  schedulePressed: {
    opacity: 0.72,
  },
  scheduleText: {
    color: nagPlanTheme.nagger.dueText,
    fontSize: 15,
    fontWeight: "700",
  },
  completedScheduleText: {
    color: nagPlanTheme.nagger.completedDueText,
  },
  activeSchedule: {
    borderColor: "#18242b",
    borderStyle: "solid",
  },
});
