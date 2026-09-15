import { useEventEmitter } from "@/shared";
import type { StartupEvent, StartupEventType } from "./contracts";

export function useStartupEvents() {
  return useEventEmitter<StartupEventType, StartupEvent>();
}
