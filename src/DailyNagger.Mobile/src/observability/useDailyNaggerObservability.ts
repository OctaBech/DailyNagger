import type {
  ActionExecutionEvent,
  ActionExecutionEventType,
  ActionExecutionWrapper,
} from "@/services/action-boundary";
import type { MemoryEventType } from "@/services/memory";
import type { ParcelFlowEvents, ParcelQueueMiddleware } from "@/services/sending";
import type { StartupEvents, StartupMiddleware } from "@/services/startup";
import type { EventEmitter } from "@/shared";
import {
  useActionBoundaryObservability,
  useMemoryObservability,
  useSendingObservability,
  useStartupObservability,
} from "./subscribers";

type DailyNaggerObservabilityInput = {
  readonly actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;
  readonly editorMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly planMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly parcelFlowEvents: ParcelFlowEvents;
  readonly startupEvents: StartupEvents;
};

type DailyNaggerObservability = {
  readonly actionExecutionWrapper: ActionExecutionWrapper;
  readonly parcelQueueMiddleware: ParcelQueueMiddleware;
  readonly startupMiddleware: StartupMiddleware;
};

export function useDailyNaggerObservability(
  input: DailyNaggerObservabilityInput,
): DailyNaggerObservability {
  const actionExecutionWrapper = useActionBoundaryObservability(input.actionEvents);
  useMemoryObservability(input.planMemoryEvents, "planMemory");
  useMemoryObservability(input.editorMemoryEvents, "editorMemory");
  const parcelQueueMiddleware = useSendingObservability(input.parcelFlowEvents);
  const startupMiddleware = useStartupObservability(input.startupEvents);

  return { actionExecutionWrapper, parcelQueueMiddleware, startupMiddleware };
}
