import { useEffect } from "react";
import type { ParcelFlowEvents } from "@/services/sending";

export function useSendingObservability(parcelFlowEvents: ParcelFlowEvents): void {
  useEffect(() => {
    return parcelFlowEvents.subscribe((eventType, event) => {
      // Sending now reports facts through events. Sentry recording will be
      // attached here through the new observability toolbox, not old recorders.
      void eventType;
      void event;
    });
  }, [parcelFlowEvents]);
}
