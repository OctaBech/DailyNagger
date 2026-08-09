import type { InteractionStampFields } from "@/models";
import { type Prettify, useRefLatestValue } from "@/shared";
import { useCallback, useMemo } from "react";
import type { CultureSettings } from "../culture";
import type { UserMoodState } from "../user-mood";

export type InteractionStampValue = {
  readonly interactionAt: string;
  readonly interactionTimeZone: string;
  readonly interactionLocale: string;
  readonly interactionMood: string | null;
  readonly interactionMoodAt: string | null;
};

export function useInteractionStamp(cultureSettings: CultureSettings, userMood: UserMoodState) {
  const cultureSettingsRef = useRefLatestValue(cultureSettings);
  const userMoodRef = useRefLatestValue(userMood);

  const create = useCallback((): InteractionStampValue => {
    const latestCultureSettings = cultureSettingsRef.current;
    const latestUserMood = userMoodRef.current;

    return {
      interactionAt: new Date().toISOString(),
      interactionTimeZone: latestCultureSettings.getUserTimeZone(),
      interactionLocale: latestCultureSettings.getUserLocale(),
      interactionMood: latestUserMood.state.selectedMood,
      interactionMoodAt: latestUserMood.state.selectedAtIso,
    };
  }, [cultureSettingsRef, userMoodRef]);

  const applyTo = useCallback(
    <TNode extends InteractionStampFields>(node: TNode): TNode => {
    return {
      ...node,
      ...create(),
    };
    },
    [create],
  );

  return useMemo(() => ({ create, applyTo }), [create, applyTo]);
}

export type InteractionStamp = Prettify<ReturnType<typeof useInteractionStamp>>;
