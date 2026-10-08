import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Sentry from "@sentry/react-native";
import { startInactiveSpan } from "@sentry/core";
import { getActiveCausalityKey } from "@/observability/sentry/getActiveCausalityKey";
import { recordBreadcrumb } from "@/observability/sentry/recordBreadcrumb";
import { reportMessage } from "@/observability/sentry/reportMessage";
import { reportError } from "@/observability/sentry/reportError";
import { spanAttributeKeys } from "@/observability/sentry/spanAttributeKeys";

jest.mock("@sentry/react-native", () => ({
  getActiveSpan: jest.fn(),
  spanToJSON: jest.fn(),
  addBreadcrumb: jest.fn(),
  captureMessage: jest.fn(),
  captureException: jest.fn(),
}));

describe("breadcrumb causality", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function setActiveKey(key: string | number | undefined): void {
    const span = startInactiveSpan({ name: "test action" });
    jest.mocked(Sentry.getActiveSpan).mockReturnValue(span);
    jest.mocked(Sentry.spanToJSON).mockReturnValue({
      data: { [spanAttributeKeys.causalityKey]: key },
      span_id: "0123456789abcdef",
      trace_id: "0123456789abcdef0123456789abcdef",
      start_timestamp: 0,
    });
  }

  it("reads the active key through the public span API and enriches existing data", () => {
    setActiveKey("action/C");
    const data = { parcelId: "parcel-1" };
    recordBreadcrumb({ category: "sending", message: "parcel.queued", data });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "sending",
      message: "parcel.queued",
      level: "info",
      data: { "dn.causality.key": "action/C", parcelId: "parcel-1" },
    });
    expect(Sentry.spanToJSON).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ parcelId: "parcel-1" });
  });

  it("keeps a breadcrumb unchanged when no span is active", () => {
    recordBreadcrumb({ category: "sending", message: "restore failed", level: "error" });
    expect(getActiveCausalityKey()).toBeUndefined();
    expect(Sentry.spanToJSON).not.toHaveBeenCalled();
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "sending",
      message: "restore failed",
      level: "error",
      data: undefined,
    });
  });

  it.each([undefined, "", 42])("does not invent a key for an invalid attribute: %s", (key) => {
    setActiveKey(key);
    const data = { parcelId: "parcel-1" };
    expect(getActiveCausalityKey()).toBeUndefined();
    recordBreadcrumb({ category: "sending", message: "parcel.queued", data });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ data }));
  });

  it("preserves an explicitly supplied key instead of replacing it with ambient causality", () => {
    setActiveKey("action/current");
    recordBreadcrumb({
      category: "sending",
      message: "parcel.queued",
      data: { "dn.causality.key": "action/original" },
    });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ data: { "dn.causality.key": "action/original" } }),
    );
  });

  it.each(["warning", "error"] as const)(
    "tags a message without changing its text or %s level",
    (level) => {
      setActiveKey("action/C");

      reportMessage("Stable message", level);

      expect(Sentry.captureMessage).toHaveBeenCalledWith("Stable message", {
        level,
        tags: { [spanAttributeKeys.causalityKey]: "action/C" },
      });
    },
  );

  it("tags the original exception on the individual event", () => {
    setActiveKey("action/C");
    const error = new Error("Controlled failure");

    reportError(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { [spanAttributeKeys.causalityKey]: "action/C" },
    });
  });

  it("reports without causality after the active span disappears", () => {
    setActiveKey("action/C");
    reportMessage("First message");
    reportError(new Error("First error"));
    jest.mocked(Sentry.getActiveSpan).mockReturnValue(undefined);
    const error = new Error("Unrelated error");

    reportMessage("Unrelated message");
    reportError(error);

    expect(Sentry.captureMessage).toHaveBeenLastCalledWith("Unrelated message", "error");
    expect(Sentry.captureException).toHaveBeenLastCalledWith(error);
  });
});
