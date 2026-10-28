import { AndroidHaptics, performAndroidHapticsAsync } from "expo-haptics";

const presets = {
  selection: AndroidHaptics.Context_Click,
  success: AndroidHaptics.Confirm,
  warning: AndroidHaptics.Reject,
} as const;

export type HapticPreset = keyof typeof presets;

const haptics = {
  play(preset: HapticPreset): void {
    void performAndroidHapticsAsync(presets[preset]).catch((error: unknown) => {
      // Optional feedback must not fail the action that requested it.
      console.warn("Haptic feedback could not be played.", error);
    });
  },
};

export function useHaptics() {
  return haptics;
}

export type Haptics = ReturnType<typeof useHaptics>;
