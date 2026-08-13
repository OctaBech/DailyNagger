import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { TimePicker } from "react-native-paper-dates";
import { SheetModal } from "./SheetModal";

type FocusedTimeInput = "hours" | "minutes";
type TimeInputMode = "picker" | "keyboard";

type NaggerTargetTimeModalProps = {
  readonly visible: boolean;
  readonly targetTime: string | null;
  readonly onDismiss: () => void;
  readonly onClear: () => void;
  readonly onDone: (targetTime: string) => void;
};

export function NaggerTargetTimeModal({
  visible,
  targetTime,
  onDismiss,
  onClear,
  onDone,
}: NaggerTargetTimeModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <VisibleNaggerTargetTimeModal
      targetTime={targetTime}
      onClear={onClear}
      onDismiss={onDismiss}
      onDone={onDone}
    />
  );
}

function VisibleNaggerTargetTimeModal({
  targetTime,
  onDismiss,
  onClear,
  onDone,
}: Omit<NaggerTargetTimeModalProps, "visible">) {
  const [draftTime, setDraftTime] = useState(() => parseTargetTime(targetTime));
  const [focusedInput, setFocusedInput] = useState<FocusedTimeInput>("hours");
  const [inputMode] = useState<TimeInputMode>("picker");

  return (
    <SheetModal
      visible
      owner="nagger-target-time-modal"
      title="Target time"
      onDismiss={onDismiss}
      footer={
        <View style={styles.actions}>
          {targetTime === null ? null : (
            <Pressable style={[styles.button, styles.secondaryButton]} onPress={onClear}>
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.button, styles.primaryButton]}
            onPress={() => onDone(formatTargetTime(draftTime.hours, draftTime.minutes))}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.picker}>
        <TimePicker
          focused={focusedInput}
          hours={draftTime.hours}
          inputType={inputMode}
          locale="da"
          minutes={draftTime.minutes}
          onChange={(value) => {
            setDraftTime({ hours: value.hours, minutes: value.minutes });
            if (value.focused !== undefined) {
              setFocusedInput(value.focused);
            }
          }}
          onFocusInput={setFocusedInput}
          use24HourClock
        />
      </View>
    </SheetModal>
  );
}

function parseTargetTime(targetTime: string | null): { hours: number; minutes: number } {
  if (targetTime === null) {
    return { hours: 9, minutes: 0 };
  }

  const [hoursText, minutesText] = targetTime.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return { hours: 9, minutes: 0 };
  }

  return { hours, minutes };
}

function formatTargetTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  button: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: "#d97828",
  },
  primaryButtonText: {
    color: "#1a1b1d",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    borderColor: "#d8d1c9",
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: "#18242b",
    fontSize: 15,
    fontWeight: "900",
  },
  picker: {
    alignItems: "center",
  },
});
