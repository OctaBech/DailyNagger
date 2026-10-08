import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { createEventEmitter } from "@/shared/useEventEmitter";
import type { Parcel, ParcelBatch } from "@/services/sending/parcel-flow/contracts";
import type {
  ParcelFlowEvent,
  ParcelFlowEventType,
} from "@/services/sending/parcel-flow/events/contracts";
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

  it("emits the saved queue restore warning when the queue was discarded", async () => {
    const startupWarning = "DailyNagger found an invalid saved parcel queue and discarded it.";
    jest.mocked(persistentStorage.load).mockReturnValue({
      queueEntries: [],
      startupWarning,
    });

    const parcelFlowEvents = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const restoreFailures: ParcelFlowEvent[] = [];
    parcelFlowEvents.subscribeTo("sending.queue.restore_failed", (_eventType, event) => {
      restoreFailures.push(event);
    });

    await renderHook(() =>
      useParcelQueue(async () => "remove-active-batch-and-stop", parcelFlowEvents),
    );

    expect(restoreFailures).toEqual([{ reason: startupWarning }]);
  });

  it("passes the batch and saved middleware context to the wrapper before sending", async () => {
    const savedContext = { trace: "saved-trace" };
    const packContextMiddleware = jest.fn(() => savedContext);
    let wrappedBatch: ParcelBatch | undefined;
    const sendParcelBatch = jest.fn<(batch: ParcelBatch) => Promise<"keep-active-batch-and-stop">>(
      async () => "keep-active-batch-and-stop",
    );
    const renderedQueue = await renderHook(() =>
      useParcelQueue(sendParcelBatch, undefined, {
        packContextMiddleware,
        wakeMiddlewareContext: (batch, run) => {
          expect(sendParcelBatch).not.toHaveBeenCalled();
          wrappedBatch = batch;
          return run();
        },
      }),
    );

    const parcelToSend = parcel("first", 1, 2);
    renderedQueue.result.current.insertParcel(parcelToSend);
    await renderedQueue.result.current.processNextParcelBatch();

    expect(packContextMiddleware).toHaveBeenCalledTimes(1);
    expect(packContextMiddleware).toHaveBeenCalledWith(parcelToSend, expect.any(Function));
    expect(wrappedBatch?.middlewareContexts).toEqual([savedContext]);
    expect(wrappedBatch?.middlewareContexts[0]).toBe(savedContext);
    expect(sendParcelBatch).toHaveBeenCalledTimes(1);
    expect(sendParcelBatch.mock.calls[0]?.[0]).toBe(wrappedBatch);
  });

  it("persists and sends a parcel with null context when no middleware is supplied", async () => {
    const sendParcelBatch = jest.fn<(batch: ParcelBatch) => Promise<"keep-active-batch-and-stop">>(
      async () => "keep-active-batch-and-stop",
    );
    const renderedQueue = await renderHook(() => useParcelQueue(sendParcelBatch));
    const parcelToSend = parcel("first", 1, 2);

    renderedQueue.result.current.insertParcel(parcelToSend);

    expect(persistentStorage.save).toHaveBeenLastCalledWith([
      { parcel: parcelToSend, middlewareContext: null },
    ]);

    await renderedQueue.result.current.processNextParcelBatch();

    expect(sendParcelBatch).toHaveBeenCalledTimes(1);
    expect(sendParcelBatch.mock.calls[0]?.[0].middlewareContexts).toEqual([null]);
    expect(sendParcelBatch.mock.calls[0]?.[0].parcels).toEqual([parcelToSend]);
  });

  it("emits both opaque contexts at coalescing and persists only the replacement context", async () => {
    jest.useFakeTimers();
    const oldContext = { opaque: "old-context" };
    const newContext = { opaque: "new-context" };
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const coalesced: ParcelFlowEvent[] = [];
    events.subscribeTo("parcel.coalesced", (_type, event) => coalesced.push(event));
    const packContextMiddleware = jest
      .fn()
      .mockReturnValueOnce(oldContext)
      .mockReturnValueOnce(newContext);
    const { result } = await renderHook(() =>
      useParcelQueue(async () => "keep-active-batch-and-stop", events, { packContextMiddleware }),
    );
    const oldParcel = parcel("old", 1, 2);
    const newParcel = parcel("new", 2, 3);

    result.current.insertParcel(oldParcel);
    result.current.insertParcel(newParcel);

    expect(coalesced).toHaveLength(1);
    expect(coalesced[0]).toEqual(
      expect.objectContaining({
        replacedParcel: oldParcel,
        replacedMiddlewareContext: oldContext,
        middlewareContext: newContext,
        parcel: expect.objectContaining({ stamp: expect.objectContaining({ parcelId: "new" }) }),
      }),
    );
    expect(persistentStorage.save).toHaveBeenLastCalledWith([
      { parcel: expect.any(Object), middlewareContext: newContext },
    ]);
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
