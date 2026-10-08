import { useCallback } from "react";
import {
  runWithMiddleware,
  type MiddlewareExecutionContext,
  type MiddlewareWrapperFunction,
} from "@/middleware";
import type { UserMoodLabel } from "@/models";
import type { CultureSettings } from "../culture";
import type { Sending } from "../sending";
import type { UserMoodState } from "./useUserMoodState";

type UseSelectUserMoodProps = {
  readonly cultureSettings: CultureSettings;
  readonly middlewareWrapperFunction?: MiddlewareWrapperFunction<MiddlewareExecutionContext>;
  readonly sending: Sending;
  readonly setCurrentMood: (mood: UserMoodLabel) => void;
  readonly userMood: UserMoodState;
};

export function useSelectUserMood({
  cultureSettings,
  middlewareWrapperFunction,
  sending,
  setCurrentMood,
  userMood,
}: UseSelectUserMoodProps) {
  return useCallback(
    (mood: UserMoodLabel) => {
      runWithMiddleware(
        () => {
          const selection = userMood.create({
            mood,
            timeZone: cultureSettings.getUserTimeZone(),
            locale: cultureSettings.getUserLocale(),
          });

          setCurrentMood(selection.mood);
          userMood.select(selection);
          sending.queue(selection);
        },
        middlewareWrapperFunction,
        {
          causalityKey: `user-mood/select:${mood}:${new Date().toISOString()}`,
          metadata: { mood },
        },
      );
    },
    [cultureSettings, middlewareWrapperFunction, sending, setCurrentMood, userMood],
  );
}
