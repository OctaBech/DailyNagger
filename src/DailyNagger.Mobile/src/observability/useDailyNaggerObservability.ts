import type { ActionExecutionEvent, ActionExecutionEventType } from "@/services/action-boundary";
import type { MemoryEventType } from "@/services/memory";
import type { Parcel, SendingEventType } from "@/services/sending";
import type { EventEmitter } from "@/shared";
import { useActionBoundaryObservability } from "./useActionBoundaryObservability";
import { useMemoryObservability } from "./useMemoryObservability";
import { useSendingObservability } from "./useSendingObservability";

type DailyNaggerObservabilityInput = {
  readonly actionEvents: EventEmitter<ActionExecutionEventType, ActionExecutionEvent>;
  readonly editorMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly planMemoryEvents: EventEmitter<MemoryEventType, void>;
  readonly sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>;
};

export function useDailyNaggerObservability(input: DailyNaggerObservabilityInput): void {
  useActionBoundaryObservability(input.actionEvents);
  useMemoryObservability(input.planMemoryEvents);
  useMemoryObservability(input.editorMemoryEvents);
  useSendingObservability(input.sendingEvents);
}
