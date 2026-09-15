import { createMMKV } from "react-native-mmkv";
import { z } from "zod";
import { parcelSchema, type Parcel } from "./contracts";
import type { ParcelQueueMiddlewareContext } from "./parcelQueueMiddleware";

const storage = createMMKV({ id: "daily-nagger-send-queue" });
const queueStorageKey = "sendQueue";

export type QueuedParcel = {
  readonly parcel: Parcel;
  readonly middlewareContext: ParcelQueueMiddlewareContext;
};

export type PersistentStorageLoadResult = {
  readonly queueEntries: QueuedParcel[];
  readonly startupWarning: string | null;
};

type PersistedParcelQueue = {
  readonly queueEntries?: readonly QueuedParcel[];
  readonly parcels?: readonly Parcel[];
  readonly savedAt: string;
};

const queuedParcelSchema = z.object({
  middlewareContext: z.unknown(),
  parcel: parcelSchema,
}) satisfies z.ZodType<QueuedParcel>;

const persistedParcelQueueSchema = z.object({
  queueEntries: z.array(queuedParcelSchema).optional(),
  parcels: z.array(parcelSchema).optional(),
  savedAt: z.iso.datetime(),
}) satisfies z.ZodType<PersistedParcelQueue>;

export const persistentStorage = {
  load,
  save,
} as const;

function load(): PersistentStorageLoadResult {
  const json = storage.getString(queueStorageKey);
  if (json === undefined) return { queueEntries: [], startupWarning: null };

  try {
    const persisted = JSON.parse(json) as unknown;
    const parsed = persistedParcelQueueSchema.safeParse(persisted);

    if (!parsed.success) {
      return discardPersistedQueue(
        "DailyNagger found an invalid saved parcel queue and discarded it.",
      );
    }

    return { queueEntries: toQueueEntries(parsed.data), startupWarning: null };
  } catch {
    storage.remove(queueStorageKey);
    return {
      queueEntries: [],
      startupWarning: "DailyNagger could not read the saved parcel queue and discarded it.",
    };
  }
}

function save(queueEntries: readonly QueuedParcel[]): void {
  if (queueEntries.length === 0) {
    storage.remove(queueStorageKey);
    return;
  }

  const persisted: PersistedParcelQueue = {
    queueEntries,
    savedAt: new Date().toISOString(),
  };

  storage.set(queueStorageKey, JSON.stringify(persisted));
}

function toQueueEntries(persisted: PersistedParcelQueue): QueuedParcel[] {
  if (persisted.queueEntries !== undefined) return [...persisted.queueEntries];

  return [...(persisted.parcels ?? [])].map((parcel) => ({
    parcel,
    middlewareContext: null,
  }));
}

function discardPersistedQueue(startupWarning: string): PersistentStorageLoadResult {
  storage.remove(queueStorageKey);
  return { queueEntries: [], startupWarning };
}

