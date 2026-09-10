import { useEffect } from "react";
import type { EventEmitter } from "@/shared";
import type { Parcel, SendingEventType } from "@/services/sending";
import { recordSendingDecision } from "./recordSendingOperation";

export function useSendingObservability(
  sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>,
): void {
  useEffect(() => {
    return sendingEvents.subscribe((eventType, batch) => {
      const decision = getSendingDecision(eventType);
      if (decision === null) return;

      recordSendingDecision(batch, decision);
    });
  }, [sendingEvents]);
}

function getSendingDecision(
  eventType: SendingEventType,
): Parameters<typeof recordSendingDecision>[1] | null {
  switch (eventType) {
    case "batch-sent":
      return "sent";
    case "batch-blocked-current-version":
      return "version-conflict-blocked";
    case "batch-forced":
      return "version-conflict-force";
    case "batch-discarded-current-version":
      return "version-conflict-discard";
    case "batch-blocked-unrepairable":
      return "unrepairable-blocked";
    case "batch-discarded-unrepairable":
      return "unrepairable-discarded";
    case "batch-failed-to-connect":
      return "connection-lost-backoff";
    case "parcel-queued":
    case "parcel-coalesced":
    case "batch-rejected-current-version":
    case "batch-rejected-unrepairable":
    case "batch-discarded":
      return null;
  }
}
