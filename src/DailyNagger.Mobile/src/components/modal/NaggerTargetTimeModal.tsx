import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { TimePicker } from "react-native-paper-dates";
import { SheetButton } from "./SheetButton";
import { SheetFooterActions, SheetFooterSpacer } from "./SheetFooterActions";
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
        <SheetFooterActions>
          {targetTime === null ? null : (
            <SheetButton area="footer" label="Clear" tone="secondary" onPress={onClear} />
          )}
          <SheetFooterSpacer />
          <SheetButton
            area="footer"
            label="Done"
            tone="primary"
            onPress={() => onDone(formatTargetTime(draftTime.hours, draftTime.minutes))}
          />
        </SheetFooterActions>
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
  picker: {
    alignItems: "center",
  },
});
