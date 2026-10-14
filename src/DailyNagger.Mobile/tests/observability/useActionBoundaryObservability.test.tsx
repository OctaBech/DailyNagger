import { expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { reportError } from "@/observability/sentry";
import { useActionBoundaryObservability } from "@/observability/subscribers/useActionBoundaryObservability";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import { createEventEmitter } from "@/shared/useEventEmitter";

jest.mock("@/observability/sentry", () => ({
  reportError: jest.fn(),
}));

it("reports action failures with their existing key", async () => {
  const events = createEventEmitter<ActionExecutionEventType, ActionExecutionEvent>();
  const { unmount } = await renderHook(() => useActionBoundaryObservability(events));
  const context = {
    causalityKey: "action/original",
    actionArguments: {},
    serviceDependencies: {},
  };
  const error = new Error("Controlled action failure");

  events.emit("action-failed", { ...context, error });
  expect(reportError).toHaveBeenCalledTimes(1);
  expect(reportError).toHaveBeenCalledWith(error, context.causalityKey);
  await unmount();
});
