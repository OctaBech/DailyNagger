import { useEffect } from "react";
import type { EventEmitter } from "@/shared";
import type { Parcel, SendingEventType } from "@/services/sending";

export function useSendingObservability(
  sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>,
): void {
  useEffect(() => {
    return sendingEvents.subscribe((eventType, batch) => {
      // Sending now reports facts through events. Sentry recording will be
      // attached here through the new observability toolbox, not old recorders.
      void eventType;
      void batch;
    });
  }, [sendingEvents]);
}

