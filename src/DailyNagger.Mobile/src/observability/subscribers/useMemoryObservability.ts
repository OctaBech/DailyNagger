import { useEffect } from "react";
import type { MemoryEventType } from "@/services/memory";
import { assertNever, type EventEmitter } from "@/shared";
import { recordBreadcrumb } from "../sentry";

export function useMemoryObservability(
  memoryEvents: EventEmitter<MemoryEventType, void>,
  memoryName: string,
): void {
  useEffect(() => {
    return memoryEvents.subscribe((eventType) => {
      recordMemoryEvent(memoryName, eventType);
    });
  }, [memoryEvents, memoryName]);
}

function recordMemoryEvent(memoryName: string, eventType: MemoryEventType): void {
  switch (eventType) {
    case "cleared":
    case "saved.selected.path":
    case "saved.tree":
    case "saved.tree.without.selection.refresh":
    case "saved.tree.and.path":
    case "saved.tree.and.focus.path":
      recordMemoryBreadcrumb(memoryName, eventType);
      return;

    default:
      assertNever(eventType);
  }
}

function recordMemoryBreadcrumb(memoryName: string, eventType: MemoryEventType): void {
  recordBreadcrumb({
    category: "memory",
    data: { memoryName },
    message: `${memoryName}.${eventType}`,
  });
}
