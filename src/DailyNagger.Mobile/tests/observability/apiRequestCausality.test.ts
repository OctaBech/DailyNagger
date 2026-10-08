import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { apiRequest } from "@/api/client/apiRequest";
import { apiRequestHeaders } from "@/api/client/apiRequestHeaders";
import { getActiveCausalityKey, getActiveSentryTraceHeader } from "@/observability/sentry";
import { spanAttributeKeys } from "@/observability/sentry/spanAttributeKeys";

jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000001" }));
jest.mock("@/config", () => ({
  environment: { apiBaseUrl: "https://example.test", apiToken: "test-token" },
}));
jest.mock("@/observability/sentry", () => ({
  getActiveCausalityKey: jest.fn(),
  getActiveSentryTraceHeader: jest.fn(),
  spanAttributeKeys: jest.requireActual<{ spanAttributeKeys: { causalityKey: string } }>(
    "@/observability/sentry/spanAttributeKeys",
  ).spanAttributeKeys,
}));

describe("API causality header", () => {
  beforeEach(() => {
    jest.mocked(getActiveCausalityKey).mockReset();
    jest.mocked(getActiveSentryTraceHeader).mockReset();
    jest.mocked(getActiveSentryTraceHeader).mockReturnValue(null);
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sends the active causality key alongside trace and base headers", async () => {
    jest.mocked(getActiveCausalityKey).mockReturnValue("action/C");
    jest.mocked(getActiveSentryTraceHeader).mockReturnValue("trace-header");

    await apiRequest({ method: "PUT", path: "/test", body: { value: 1 } });

    expect(fetch).toHaveBeenCalledWith("https://example.test/test", {
      method: "PUT",
      body: JSON.stringify({ value: 1 }),
      headers: {
        [apiRequestHeaders.authorization]: "Bearer test-token",
        [apiRequestHeaders.requestId]: "00000000-0000-0000-0000-000000000001",
        [apiRequestHeaders.sentryTrace]: "trace-header",
        [spanAttributeKeys.causalityKey]: "action/C",
        "Content-Type": "application/json",
      },
    });
    expect(getActiveCausalityKey).toHaveBeenCalledTimes(1);
  });

  it("does not carry a previous request's key into a call without active causality", async () => {
    jest
      .mocked(getActiveCausalityKey)
      .mockReturnValueOnce("action/C")
      .mockReturnValueOnce(undefined);

    await apiRequest({ method: "GET", path: "/first" });
    await apiRequest({ method: "GET", path: "/second" });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "https://example.test/first",
      expect.objectContaining({
        headers: expect.objectContaining({ [spanAttributeKeys.causalityKey]: "action/C" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(2, "https://example.test/second", {
      method: "GET",
      body: undefined,
      headers: {
        [apiRequestHeaders.authorization]: "Bearer test-token",
        [apiRequestHeaders.requestId]: "00000000-0000-0000-0000-000000000001",
      },
    });
  });
});
