import { useEffect } from "react";
import { appVariant } from "@/config/appVariant";
import type { ParcelFlowEvents } from "../sending";
import { demoDataParcelTypes } from "../sending/queueDemoData";
import type { Startup } from "../startup";

export function useDemoDataSync(parcelFlowEvents: ParcelFlowEvents, restart: Startup["restart"]) {
  useEffect(() => {
    if (appVariant !== "demo") return;

    return parcelFlowEvents.subscribeTo("parcel.batch.send.completed", (_eventType, event) => {
      if (event.result?.kind !== "sent") return;

      const type = event.parcel?.formula.type;
      if (type !== demoDataParcelTypes.copy && type !== demoDataParcelTypes.delete) return;

      // Queue removal is complete; startup can flush, reload and apply rollover normally.
      void restart();
    });
  }, [parcelFlowEvents, restart]);
}
