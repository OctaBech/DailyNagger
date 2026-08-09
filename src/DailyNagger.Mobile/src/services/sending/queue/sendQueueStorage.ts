import { createMMKV } from "react-native-mmkv";
import { parcelSchema, type Parcel } from "../contracts";
import { z } from "zod";

const storage = createMMKV({ id: "daily-nagger-send-queue" });
const queueStorageKey = "sendQueue";

export type SendQueueStorageLoadResult = {
  readonly queue: Parcel[];
  readonly startupWarning: string | null;
};

type PersistedSendQueue = {
  readonly savedAt: string;
  readonly queue: readonly Parcel[];
};

const persistedSendQueueSchema = z.object({
  savedAt: z.iso.datetime(),
  queue: z.array(parcelSchema),
}) satisfies z.ZodType<PersistedSendQueue>;

export const sendQueueStorage = {
  load,
  save,
} as const;

function load(): SendQueueStorageLoadResult {
  const json = storage.getString(queueStorageKey);
  if (json === undefined) return { queue: [], startupWarning: null };

  try {
    const persisted = JSON.parse(json) as unknown;

    const parsed = persistedSendQueueSchema.safeParse(persisted);

    if (!parsed.success) {
      return discardPersistedQueue(
        "DailyNagger found an invalid saved send queue and discarded it.",
      );
    }

    const persistedQueue = parsed.data;

    return { queue: [...persistedQueue.queue], startupWarning: null };
  } catch {
    storage.remove(queueStorageKey);
    return {
      queue: [],
      startupWarning: "DailyNagger could not read the saved send queue and discarded it.",
    };
  }
}

function save(queue: readonly Parcel[]): void {
  if (queue.length === 0) {
    storage.remove(queueStorageKey);
    return;
  }

  const persisted: PersistedSendQueue = {
    savedAt: new Date().toISOString(),
    queue,
  };

  storage.set(queueStorageKey, JSON.stringify(persisted));
}

function discardPersistedQueue(startupWarning: string): SendQueueStorageLoadResult {
  storage.remove(queueStorageKey);
  return { queue: [], startupWarning };
}
