import { useCallback } from "react";
import type { CultureSettings } from "../culture";
import type { Sending } from "../sending";
import type { UserMoodLabel } from "@/models";
import type { UserMoodState } from "./useUserMoodState";

type UseSelectUserMoodProps = {
  readonly cultureSettings: CultureSettings;
  readonly sending: Sending;
  readonly setCurrentMood: (mood: UserMoodLabel) => void;
  readonly userMood: UserMoodState;
};

export function useSelectUserMood({
  cultureSettings,
  sending,
  setCurrentMood,
  userMood,
}: UseSelectUserMoodProps) {
  return useCallback(
    (mood: UserMoodLabel) => {
      const selection = userMood.create({
        mood,
        timeZone: cultureSettings.getUserTimeZone(),
        locale: cultureSettings.getUserLocale(),
      });

      setCurrentMood(selection.mood);
      userMood.select(selection);
      sending.queue(selection);
    },
    [cultureSettings, sending, setCurrentMood, userMood],
  );
}
