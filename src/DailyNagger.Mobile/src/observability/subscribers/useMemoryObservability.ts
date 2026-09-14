import { useEffect } from "react";
import type { MemoryEventType } from "@/services/memory";
import type { EventEmitter } from "@/shared";
import { recordBreadcrumb } from "../sentry";

export function useMemoryObservability(
  memoryEvents: EventEmitter<MemoryEventType, void>,
  memoryName: string,
): void {
  useEffect(() => {
    return memoryEvents.subscribe((eventType) => {
      recordBreadcrumb({
        category: "memory",
        data: { memoryName },
        message: `${memoryName}.${eventType}`,
      });
    });
  }, [memoryEvents, memoryName]);
}
