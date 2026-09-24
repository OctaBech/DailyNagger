import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import type { Parcel, ParcelBatch } from "@/services/sending/parcel-flow/contracts";
import {
  persistentStorage,
  type QueuedParcel,
} from "@/services/sending/parcel-flow/persistentStorage";
import { useParcelQueue } from "@/services/sending/parcel-flow/useParcelQueue";

jest.mock("@/services/sending/parcel-flow/persistentStorage", () => ({
  persistentStorage: {
    load: jest.fn(),
    save: jest.fn(),
  },
}));

function parcel(parcelId: string, baseVersion: number, nextVersion: number): Parcel {
  return {
    formula: {
      type: "nagger",
      label: "Test nagger",
      ownerType: "nagger",
      ownerId: "same-root",
      coalesceKey: "same-content",
      canBatch: true,
      sendMethod: "PUT",
      endpointPath: "/test",
      recipientExpectsVersioning: true,
      payload: { parcelId },
    },
    stamp: {
      parcelId,
      queuedAt: "2026-09-23T10:00:00.000Z",
      baseVersion,
      nextVersion,
      clientIdentity: { clientId: "test-client", deviceName: "test", deviceModel: "test" },
    },
  };
}

describe("useParcelQueue", () => {
  beforeEach(() => {
    jest.mocked(persistentStorage.load).mockReset();
    jest.mocked(persistentStorage.save).mockReset();
    jest.mocked(persistentStorage.load).mockReturnValue({
      queueEntries: [],
      startupWarning: null,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("replaces an unsent parcel and keeps the full version range", async () => {
    const savedQueues: QueuedParcel[][] = [];
    jest.mocked(persistentStorage.save).mockImplementation((entries) => {
      savedQueues.push([...entries]);
    });

    let sentBatch: ParcelBatch | undefined;
    const sendParcelBatch = async (batch: ParcelBatch) => {
      sentBatch = batch;
      return "keep-active-batch-and-stop" as const;
    };

    const renderedQueue = await renderHook(() => useParcelQueue(sendParcelBatch));

    renderedQueue.result.current.insertParcel(parcel("first", 1, 2));
    renderedQueue.result.current.insertParcel(parcel("second", 2, 3));

    const latestSavedQueue = savedQueues.at(-1);
    expect(latestSavedQueue).toHaveLength(1);
    expect(latestSavedQueue?.[0].parcel.stamp).toMatchObject({
      parcelId: "second",
      baseVersion: 1,
      nextVersion: 3,
    });

    await renderedQueue.result.current.processNextParcelBatch();

    expect(sentBatch?.parcels).toHaveLength(1);
    expect(sentBatch?.versioning).toEqual({ existingVersion: 1, newVersion: 3 });
  });

  it("waits for the debounce delay before sending a new parcel", async () => {
    let sendCount = 0;
    const sendParcelBatch = async (_batch: ParcelBatch) => {
      sendCount += 1;
      return "remove-active-batch-and-stop" as const;
    };

    const renderedQueue = await renderHook(() => useParcelQueue(sendParcelBatch));

    // Start the simulated clock after React has mounted the hook.
    jest.useFakeTimers();
    renderedQueue.result.current.insertParcel(parcel("first", 1, 2));

    expect(sendCount).toBe(0);

    await jest.advanceTimersByTimeAsync(999);
    expect(sendCount).toBe(0);

    await jest.advanceTimersByTimeAsync(1);
    expect(sendCount).toBe(1);
  });

  it("keeps the parcel and retries after connection backoff", async () => {
    let sendCount = 0;
    const sendParcelBatch = async (_batch: ParcelBatch) => {
      sendCount += 1;
      return "keep-active-batch-and-backoff" as const;
    };

    const renderedQueue = await renderHook(() => useParcelQueue(sendParcelBatch));

    jest.useFakeTimers();
    renderedQueue.result.current.insertParcel(parcel("first", 1, 2));

    await jest.advanceTimersByTimeAsync(1000);
    expect(sendCount).toBe(1);
    expect(renderedQueue.result.current.hasElements()).toBe(true);

    await jest.advanceTimersByTimeAsync(4999);
    expect(sendCount).toBe(1);

    await jest.advanceTimersByTimeAsync(1);
    expect(sendCount).toBe(2);
    expect(renderedQueue.result.current.hasElements()).toBe(true);
  });
});
