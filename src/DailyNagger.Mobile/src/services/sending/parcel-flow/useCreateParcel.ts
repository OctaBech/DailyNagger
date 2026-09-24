import { isNagger, isTaskEntry, isTaskLog, isUserMood, type UserMoodLabel } from "@/models";
import { naggerToDto, taskLogToDto } from "@/services/model-conversion";
import { createParcelVersionStamp } from "@/services/parcel-versioning";
import { newGuid } from "@/shared";
import type { Memory } from "../../contracts";
import { useClientIdentity } from "../../clientIdentity";
import type { Formula } from "../contracts";
import { createNaggerFormula } from "../queueNagger";
import { createTaskEntryFormula } from "../queueTaskEntry";
import { createTaskLogFormula } from "../queueTaskLog";
import { createUserMoodFormula } from "../queueUserMood";
import type { Parcel, SendableContent } from "./contracts";
import type { ParcelFlowEvents } from "./events";

export type CreateParcel = (content: SendableContent) => Parcel;

export function useCreateParcel(
  versionMemory: Memory,
  getCurrentMood: () => UserMoodLabel | null,
  parcelFlowEvents?: ParcelFlowEvents,
): CreateParcel {
  const clientIdentity = useClientIdentity();

  function createParcel(content: SendableContent): Parcel {
    // 1. Get the formula for how the sendable content should be handled.
    const formula = createFormula(content);

    // 2. Set the expected data-root version and the new client version before queueing.
    const queuedAt = new Date().toISOString();
    const versionStamp = formula.recipientExpectsVersioning
      ? createParcelVersionStamp({ memory: versionMemory, formula, queuedAt })
      : {};

    // 3. Stamp the parcel with local sending metadata.
    const parcel = {
      formula,
      stamp: {
        parcelId: newGuid(),
        queuedAt,
        mood: getCurrentMood(),
        clientIdentity,
        ...versionStamp,
      },
    } satisfies Parcel;

    // 4. Emit the created parcel before returning it to the caller.
    parcelFlowEvents?.emit("parcel.created", { parcel });
    return parcel;
  }

  function createFormula(content: SendableContent): Formula {
    if ("nodeType" in content) {
      if (isNagger(content)) return createNaggerFormula(naggerToDto(content));
      if (isTaskLog(content)) return createTaskLogFormula(taskLogToDto(content));
      if (isTaskEntry(content)) return createTaskEntryFormula(content);
    }

    if (isUserMood(content)) return createUserMoodFormula(content);

    throw new Error("Cannot create parcel because no sending formula matches the content.");
  }

  return createParcel;
}
