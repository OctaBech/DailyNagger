import { createMMKV } from "react-native-mmkv";
import { z } from "zod";
import { parcelSchema, type Parcel } from "./contracts";

const storage = createMMKV({ id: "daily-nagger-send-queue" });
const queueStorageKey = "sendQueue";

export type PersistentStorageLoadResult = {
  readonly parcels: Parcel[];
  readonly startupWarning: string | null;
};

type PersistedParcelQueue = {
  readonly parcels: readonly Parcel[];
  readonly savedAt: string;
};

const persistedParcelQueueSchema = z.object({
  parcels: z.array(parcelSchema),
  savedAt: z.iso.datetime(),
}) satisfies z.ZodType<PersistedParcelQueue>;

export const persistentStorage = {
  load,
  save,
} as const;

function load(): PersistentStorageLoadResult {
  const json = storage.getString(queueStorageKey);
  if (json === undefined) return { parcels: [], startupWarning: null };

  try {
    const persisted = JSON.parse(json) as unknown;
    const parsed = persistedParcelQueueSchema.safeParse(persisted);

    if (!parsed.success) {
      return discardPersistedQueue(
        "DailyNagger found an invalid saved parcel queue and discarded it.",
      );
    }

    return { parcels: [...parsed.data.parcels], startupWarning: null };
  } catch {
    storage.remove(queueStorageKey);
    return {
      parcels: [],
      startupWarning: "DailyNagger could not read the saved parcel queue and discarded it.",
    };
  }
}

function save(parcels: readonly Parcel[]): void {
  if (parcels.length === 0) {
    storage.remove(queueStorageKey);
    return;
  }

  const persisted: PersistedParcelQueue = {
    parcels,
    savedAt: new Date().toISOString(),
  };

  storage.set(queueStorageKey, JSON.stringify(persisted));
}

function discardPersistedQueue(startupWarning: string): PersistentStorageLoadResult {
  storage.remove(queueStorageKey);
  return { parcels: [], startupWarning };
}

