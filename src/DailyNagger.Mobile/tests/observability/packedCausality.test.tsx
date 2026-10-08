import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import * as Sentry from "@sentry/react-native";
import type * as SentryCore from "@sentry/core";
import { continueTrace, getTraceData, startInactiveSpan } from "@sentry/core";
import {
  packActiveSpan,
  recordBreadcrumb,
  recordSpanValue,
  spanAttributeKeys,
  spanNames,
  spanOperations,
  startNewSpan,
} from "@/observability/sentry";
import { useSendingObservability } from "@/observability/subscribers/useSendingObservability";
import type { ParcelBatch, ParcelFlowEvent, ParcelFlowEventType } from "@/services/sending";
import { createEventEmitter } from "@/shared/useEventEmitter";

jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000001" }));

jest.mock("@sentry/react-native", () => ({
  getActiveSpan: jest.fn(),
  spanToJSON: jest.fn(),
}));

jest.mock("@sentry/core", () => ({
  ...jest.requireActual<typeof SentryCore>("@sentry/core"),
  getTraceData: jest.fn(),
  continueTrace: jest.fn((_context: unknown, run: () => unknown) => run()),
}));

jest.mock("@/observability/sentry/recordSpanValue", () => ({
  recordSpanValue: jest.fn(),
}));
jest.mock("@/observability/sentry/recordBreadcrumb", () => ({
  recordBreadcrumb: jest.fn(),
}));
jest.mock("@/observability/sentry/startNewSpan", () => ({
  startNewSpan: jest.fn(({ run }: { run: () => unknown }) => run()),
}));

describe("persistent span causality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Sentry.getActiveSpan).mockReturnValue(startInactiveSpan({ name: "action" }));
    jest.mocked(getTraceData).mockReturnValue({
      "sentry-trace": "0123456789abcdef0123456789abcdef-0123456789abcdef-1",
      baggage: "sentry-environment=test",
    });
    jest.mocked(Sentry.spanToJSON).mockReturnValue({
      data: { [spanAttributeKeys.causalityKey]: "action/original" },
      span_id: "0123456789abcdef",
      trace_id: "0123456789abcdef0123456789abcdef",
      start_timestamp: 0,
    });
  });

  it("packs an explicit null when the active span has no causality key", () => {
    jest.mocked(Sentry.spanToJSON).mockReturnValue({
      data: {},
      span_id: "0123456789abcdef",
      trace_id: "0123456789abcdef0123456789abcdef",
      start_timestamp: 0,
    });

    expect(packActiveSpan()).toEqual({
      sentryTrace: expect.any(String),
      baggage: "sentry-environment=test",
      [spanAttributeKeys.causalityKey]: null,
    });
  });

  it("returns no packed context when no span is active", () => {
    jest.mocked(Sentry.getActiveSpan).mockReturnValue(undefined);
    expect(packActiveSpan()).toBeNull();
    expect(getTraceData).not.toHaveBeenCalled();
  });

  it("restores the saved key inside the sending span before running the sender", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const { result } = await renderHook(() => useSendingObservability(events));
    const packed = packActiveSpan();
    expect(packed).toEqual({
      sentryTrace: expect.any(String),
      baggage: "sentry-environment=test",
      [spanAttributeKeys.causalityKey]: "action/original",
    });
    const restored: unknown = JSON.parse(JSON.stringify(packed));
    jest.mocked(Sentry.getActiveSpan).mockReturnValue(undefined);
    const batch: ParcelBatch = {
      parcels: [],
      middlewareContexts: [restored],
      versioning: { existingVersion: 1, newVersion: 2 },
    };

    const instruction = await result.current.wakeMiddlewareContext?.(batch, async () => {
      expect(recordSpanValue).toHaveBeenCalledWith(
        spanAttributeKeys.causalityKey,
        "action/original",
      );
      return "remove-active-batch-and-drain-next";
    });

    expect(instruction).toBe("remove-active-batch-and-drain-next");
  });

  it("runs the sender without inventing a key for a saved null", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const { result } = await renderHook(() => useSendingObservability(events));
    const batch: ParcelBatch = {
      parcels: [],
      middlewareContexts: [
        {
          sentryTrace: "0123456789abcdef0123456789abcdef-0123456789abcdef-1",
          baggage: null,
          [spanAttributeKeys.causalityKey]: null,
        },
      ],
      versioning: { existingVersion: 1, newVersion: 2 },
    };

    expect(
      await result.current.wakeMiddlewareContext?.(
        batch,
        async () => "keep-active-batch-and-backoff",
      ),
    ).toBe("keep-active-batch-and-backoff");
    expect(recordSpanValue).not.toHaveBeenCalledWith(
      spanAttributeKeys.causalityKey,
      expect.anything(),
    );
  });

  it("records the replaced parcel's fate in its own trace without changing either context", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    await renderHook(() => useSendingObservability(events));
    const oldContext = Object.freeze({
      sentryTrace: "old-trace",
      baggage: null,
      [spanAttributeKeys.causalityKey]: "action/A",
    });
    const newContext = Object.freeze({
      sentryTrace: "new-trace",
      baggage: null,
      [spanAttributeKeys.causalityKey]: "action/B",
    });

    events.emit("parcel.coalesced", {
      replacedMiddlewareContext: oldContext,
      middlewareContext: newContext,
    });

    expect(continueTrace).toHaveBeenCalledWith(
      { sentryTrace: "old-trace", baggage: undefined },
      expect.any(Function),
    );
    expect(startNewSpan).toHaveBeenCalledWith({
      name: "parcel.coalesced",
      operation: "dn.sending.coalesced",
      run: expect.any(Function),
    });
    expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/A");
    expect(recordSpanValue).toHaveBeenCalledWith(
      spanAttributeKeys.replacedByCausalityKey,
      "action/B",
    );
    expect(recordBreadcrumb).toHaveBeenCalledTimes(1);
    expect(newContext).toEqual({
      sentryTrace: "new-trace",
      baggage: null,
      [spanAttributeKeys.causalityKey]: "action/B",
    });
  });

  it("keeps the breadcrumb but does not invent an old trace when no context was saved", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    await renderHook(() => useSendingObservability(events));

    events.emit("parcel.coalesced", { replacedMiddlewareContext: null, middlewareContext: null });

    expect(continueTrace).not.toHaveBeenCalled();
    expect(startNewSpan).not.toHaveBeenCalled();
    expect(recordBreadcrumb).toHaveBeenCalledTimes(1);
  });

  it("uses the newest context for sending and links the other participants through the shared helper", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const { result } = await renderHook(() => useSendingObservability(events));
    const contexts = ["A", "B", "C"].map((key) =>
      Object.freeze({
        sentryTrace: `trace-${key}`,
        baggage: null,
        [spanAttributeKeys.causalityKey]: `action/${key}`,
      }),
    );
    const batch: ParcelBatch = {
      parcels: [],
      middlewareContexts: contexts,
      versioning: { existingVersion: 1, newVersion: 4 },
    };
    const send = jest.fn<() => Promise<"remove-active-batch-and-drain-next">>(async () => {
      expect(recordSpanValue).toHaveBeenLastCalledWith(
        spanAttributeKeys.sendAttemptId,
        expect.any(String),
      );
      return "remove-active-batch-and-drain-next";
    });

    expect(await result.current.wakeMiddlewareContext?.(batch, send)).toBe(
      "remove-active-batch-and-drain-next",
    );

    expect(send).toHaveBeenCalledTimes(1);
    expect(continueTrace).toHaveBeenNthCalledWith(
      1,
      { sentryTrace: "trace-A", baggage: undefined },
      expect.any(Function),
    );
    expect(continueTrace).toHaveBeenNthCalledWith(
      2,
      { sentryTrace: "trace-B", baggage: undefined },
      expect.any(Function),
    );
    expect(continueTrace).toHaveBeenNthCalledWith(
      3,
      { sentryTrace: "trace-C", baggage: undefined },
      expect.any(Function),
    );
    expect(startNewSpan).toHaveBeenNthCalledWith(1, {
      name: spanNames.parcelBatched,
      operation: spanOperations.sendingBatched,
      run: expect.any(Function),
    });
    expect(startNewSpan).toHaveBeenNthCalledWith(2, {
      name: spanNames.parcelBatched,
      operation: spanOperations.sendingBatched,
      run: expect.any(Function),
    });
    expect(startNewSpan).toHaveBeenNthCalledWith(3, {
      name: spanNames.parcelBatchSend,
      operation: spanOperations.sendingBatch,
      run: expect.any(Function),
    });
    expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/A");
    expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/B");
    expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/C");
    expect(
      jest
        .mocked(recordSpanValue)
        .mock.calls.filter(([key]) => key === spanAttributeKeys.batchedWithCausalityKey),
    ).toEqual([
      [spanAttributeKeys.batchedWithCausalityKey, "action/C"],
      [spanAttributeKeys.batchedWithCausalityKey, "action/C"],
    ]);
    const attemptIds = jest
      .mocked(recordSpanValue)
      .mock.calls.filter(([key]) => key === spanAttributeKeys.sendAttemptId)
      .map(([, value]) => value);
    expect(attemptIds).toHaveLength(3);
    expect(new Set(attemptIds).size).toBe(1);
    expect(batch.middlewareContexts).toEqual(contexts);
  });

  it("does not invent participant spans for missing contexts or a single parcel", async () => {
    const events = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    const { result } = await renderHook(() => useSendingObservability(events));
    const context = {
      sentryTrace: "known-trace",
      baggage: null,
      [spanAttributeKeys.causalityKey]: "action/A",
    };
    const batch: ParcelBatch = {
      parcels: [],
      middlewareContexts: [context, null],
      versioning: { existingVersion: 1, newVersion: 2 },
    };
    await result.current.wakeMiddlewareContext?.(
      batch,
      async () => "keep-active-batch-and-backoff",
    );
    expect(startNewSpan).toHaveBeenCalledTimes(1);
    expect(recordSpanValue).not.toHaveBeenCalledWith(
      spanAttributeKeys.batchedWithCausalityKey,
      expect.anything(),
    );
  });
});
