import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import * as Sentry from "@sentry/react-native";
import { useSendingObservability } from "@/observability/subscribers/useSendingObservability";
import type { ParcelFlowEvent, ParcelFlowEventType } from "@/services/sending";
import { createEventEmitter } from "@/shared/useEventEmitter";

jest.mock("@sentry/react-native", () => ({
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
}));

describe("useSendingObservability", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records the restore reason before sending a standalone Sentry event", async () => {
    const parcelFlowEvents = createEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
    await renderHook(() => useSendingObservability(parcelFlowEvents));

    const reason = "DailyNagger found an invalid saved parcel queue and discarded it.";
    parcelFlowEvents.emit("sending.queue.restore_failed", { reason });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "sending",
      data: expect.objectContaining({ "dn.queue.restore_failure_reason": reason }),
      level: "error",
      message: "sending.queue.restore_failed",
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Persistent sending queue could not be restored",
      "error",
    );
    expect(Sentry.addBreadcrumb).toHaveBeenCalledTimes(1);
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1);
    expect(jest.mocked(Sentry.addBreadcrumb).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(Sentry.captureMessage).mock.invocationCallOrder[0],
    );
  });
});
