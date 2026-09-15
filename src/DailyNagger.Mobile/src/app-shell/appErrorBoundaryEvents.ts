import type { ErrorInfo } from "react";
import { createEventEmitter } from "@/shared";

export type AppErrorBoundaryEventType = "app.error-boundary.caught";

export type AppErrorBoundaryEvent = {
  readonly error: Error;
  readonly errorInfo: ErrorInfo;
};

export const appErrorBoundaryEvents = createEventEmitter<
  AppErrorBoundaryEventType,
  AppErrorBoundaryEvent
>();
