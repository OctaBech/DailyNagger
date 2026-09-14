import { useEventEmitter } from "@/shared";
import type { ParcelFlowEvent, ParcelFlowEventType } from "./contracts";

export function useParcelFlowEvents() {
  return useEventEmitter<ParcelFlowEventType, ParcelFlowEvent>();
}

