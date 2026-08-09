import { toJsonValue } from "@/shared";
import type { UserMood } from "@/models";
import type { Formula } from "./contracts";

export function createUserMoodFormula(selection: UserMood): Formula {
  return {
    type: "user-mood-recorded",
    label: selection.mood,
    ownerType: "none",
    ownerId: null,
    coalesceKey: `UserMood:${selection.id}`,
    canBatch: false,
    sendMethod: "POST",
    endpointPath: "/api/user-moods",
    recipientExpectsVersioning: false,
    payload: toJsonValue({
      id: selection.id,
      mood: selection.mood,
      recordedAt: selection.recordedAt,
      timeZone: selection.timeZone,
      locale: selection.locale,
    }),
  };
}
