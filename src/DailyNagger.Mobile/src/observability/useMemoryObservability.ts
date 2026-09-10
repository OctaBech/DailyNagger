import { useEffect } from "react";
import type { MemoryEventType } from "@/services/memory";
import type { EventEmitter } from "@/shared";

export function useMemoryObservability(
  memoryEvents: EventEmitter<MemoryEventType, void>,
): void {
  useEffect(() => {
    return memoryEvents.subscribe((eventType) => {
      // Memory reports that a write happened. Observability decides later
      // whether that fact becomes a breadcrumb, metric, or nothing.
      void eventType;
    });
  }, [memoryEvents]);
}
