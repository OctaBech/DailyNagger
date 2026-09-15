import type {
  ActionExecutionEvent,
  ActionExecutionEventType,
  ActionExecutionWrapper,
} from "@/services/action-boundary";
import type { MemoryEventType } from "@/services/memory";
import type { ParcelFlowEvents } from "@/services/sending";
import type { EventEmitter } from "@/shared";
import {
  useActionBoundaryObservability,
  useMemoryObservability,
  useSendingObservability,
} from "./subscribers";

type DailyNaggerObservabilityInput = {
  readonly actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;
  readonly editorMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly planMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly parcelFlowEvents: ParcelFlowEvents;
};

type DailyNaggerObservability = {
  readonly actionExecutionWrapper: ActionExecutionWrapper;
};

export function useDailyNaggerObservability(
  input: DailyNaggerObservabilityInput,
): DailyNaggerObservability {
  const actionExecutionWrapper = useActionBoundaryObservability(input.actionEvents);
  useMemoryObservability(input.planMemoryEvents, "planMemory");
  useMemoryObservability(input.editorMemoryEvents, "editorMemory");
  useSendingObservability(input.parcelFlowEvents);

  return { actionExecutionWrapper };
}


