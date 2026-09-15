import type { MiddlewareWrapperFunction } from "@/middleware";
import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import type { MemoryEventType } from "@/services/memory";
import type { ParcelFlowEvents, ParcelQueueMiddleware } from "@/services/sending";
import type { StartupEvents } from "@/services/startup";
import type { EventEmitter } from "@/shared";
import {
  useAppErrorBoundaryObservability,
  useApiRequestObservability,
  useActionBoundaryObservability,
  useMemoryObservability,
  useRolloverObservability,
  useSendingObservability,
  useStartupObservability,
  useUserMoodObservability,
} from "./subscribers";

type DailyNaggerObservabilityInput = {
  readonly actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;
  readonly editorMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly planMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly parcelFlowEvents: ParcelFlowEvents;
  readonly startupEvents: StartupEvents;
};

type DailyNaggerObservability = {
  readonly actionMiddlewareWrapperFunction: MiddlewareWrapperFunction;
  readonly parcelQueueMiddleware: ParcelQueueMiddleware;
  readonly rolloverNaggerMiddlewareWrapperFunction: MiddlewareWrapperFunction;
  readonly startupMiddlewareWrapperFunction: MiddlewareWrapperFunction;
  readonly userMoodMiddlewareWrapperFunction: MiddlewareWrapperFunction;
};

export function useDailyNaggerObservability(
  input: DailyNaggerObservabilityInput,
): DailyNaggerObservability {
  useAppErrorBoundaryObservability();
  useApiRequestObservability();
  const actionMiddlewareWrapperFunction = useActionBoundaryObservability(input.actionEvents);
  useMemoryObservability(input.planMemoryEvents, "planMemory");
  useMemoryObservability(input.editorMemoryEvents, "editorMemory");
  const parcelQueueMiddleware = useSendingObservability(input.parcelFlowEvents);
  const rolloverNaggerMiddlewareWrapperFunction = useRolloverObservability();
  const startupMiddlewareWrapperFunction = useStartupObservability(input.startupEvents);
  const userMoodMiddlewareWrapperFunction = useUserMoodObservability();

  return {
    actionMiddlewareWrapperFunction,
    parcelQueueMiddleware,
    rolloverNaggerMiddlewareWrapperFunction,
    startupMiddlewareWrapperFunction,
    userMoodMiddlewareWrapperFunction,
  };
}
