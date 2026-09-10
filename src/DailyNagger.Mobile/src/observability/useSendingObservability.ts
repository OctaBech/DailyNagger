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
      return "batch-sent";
    case "batch-blocked-current-version":
      return "batch-blocked-current-version";
    case "batch-forced":
      return "batch-forced";
    case "batch-discarded-current-version":
      return "batch-discarded-current-version";
    case "batch-blocked-unrepairable":
      return "batch-blocked-unrepairable";
    case "batch-discarded-unrepairable":
      return "batch-discarded-unrepairable";
    case "batch-failed-to-connect":
      return "batch-failed-to-connect";
    case "parcel-queued":
    case "parcel-coalesced":
    case "batch-rejected-current-version":
    case "batch-rejected-unrepairable":
    case "batch-discarded":
      return null;
  }
}
