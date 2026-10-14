import { beforeEach, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import {
  recordSpanValue,
  reportError,
  spanAttributeKeys,
  startNewSpan,
} from "@/observability/sentry";
import { sentryConfig } from "@/config/sentryConfig";
import { useActionBoundaryObservability } from "@/observability/subscribers/useActionBoundaryObservability";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import { createEventEmitter } from "@/shared/useEventEmitter";

jest.mock("@/observability/sentry", () => ({
  reportError: jest.fn(),
  recordSpanValue: jest.fn(),
  startNewSpan: jest.fn(({ run }: { run: () => unknown }) => run()),
  spanAttributeKeys: { causalityKey: "dn.causality.key", nodeIds: "dn.node.ids" },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it("labels nodes and records full ids without private content", async () => {
  const firstId = "019feaac-0cde-769b-bd7f-12345678abcd";
  const secondId = "019feaac-0cde-769b-bd7f-1234deadbeef";
  const events = createEventEmitter<ActionExecutionEventType, ActionExecutionEvent>();
  const { result, unmount } = await renderHook(() => useActionBoundaryObservability(events));
  const run = jest.fn();

  result.current(
    {
      causalityKey: "action/original",
      metadata: { actionKey: "plan-screen/taskEntry/setValue" },
      actionArguments: {
        taskEntry: { id: firstId, label: "Private label", children: [{ id: "child-id" }] },
        otherNode: { id: secondId },
        newValue: "Private value",
      },
      serviceDependencies: {},
    },
    run,
  );

  expect(startNewSpan).toHaveBeenCalledWith(
    expect.objectContaining({
      name: `plan-screen/taskEntry/setValue [node:${firstId.slice(-sentryConfig.nodeIdDisplayLength)}, node:${secondId.slice(-sentryConfig.nodeIdDisplayLength)}]`,
    }),
  );
  expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.nodeIds, [firstId, secondId]);
  expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/original");
  expect(JSON.stringify(jest.mocked(recordSpanValue).mock.calls)).not.toMatch(/Private|child-id/);
  expect(run).toHaveBeenCalledTimes(1);
  await unmount();
});

it("keeps the action name unchanged when its arguments contain no nodes", async () => {
  const events = createEventEmitter<ActionExecutionEventType, ActionExecutionEvent>();
  const { result, unmount } = await renderHook(() => useActionBoundaryObservability(events));
  const run = jest.fn();

  result.current(
    {
      causalityKey: "action/original",
      metadata: { actionKey: "plan-screen/example/run" },
      actionArguments: {},
      serviceDependencies: {},
    },
    run,
  );

  expect(startNewSpan).toHaveBeenCalledWith(
    expect.objectContaining({
      name: "plan-screen/example/run",
    }),
  );
  expect(recordSpanValue).not.toHaveBeenCalledWith(spanAttributeKeys.nodeIds, expect.anything());
  expect(recordSpanValue).toHaveBeenCalledWith(spanAttributeKeys.causalityKey, "action/original");
  expect(run).toHaveBeenCalledTimes(1);
  await unmount();
});

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
