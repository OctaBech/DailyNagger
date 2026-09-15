import { useEffect, useState } from "react";
import { postOfficeStripConfig } from "@/config";
import type { ParcelFlowEvents } from "@/services";
import { handleSendingEvent } from "./postOfficeStripState";
import type { PostOfficeStripState } from "./postOfficeStripModel";
import { tickVisualParcels } from "./postOfficeVisualParcel";

export function usePostOfficeStrip(sendingEvents: ParcelFlowEvents): PostOfficeStripState {
  const [state, setState] = useState<PostOfficeStripState>({
    visualParcels: [],
    postBoxIsClosed: false,
  });

  useEffect(() => {
    return sendingEvents.subscribe((eventType, event) => {
      setState((currentState) => handleSendingEvent(eventType, event, currentState));
    });
  }, [sendingEvents]);

  useEffect(() => {
    const timer = setInterval(() => {
      setState((currentState) => ({
        ...currentState,
        visualParcels: tickVisualParcels(currentState.visualParcels, currentState.postBoxIsClosed),
      }));
    }, postOfficeStripConfig.tickMs);

    return () => clearInterval(timer);
  }, []);

  return state;
}
