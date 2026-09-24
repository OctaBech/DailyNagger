import type { HibernatingMiddleware } from "@/middleware";
import type { ParcelQueueInstruction } from "./contracts";

export type ParcelQueueMiddlewareContext = unknown;

export type ParcelQueueMiddleware = HibernatingMiddleware<
  ParcelQueueMiddlewareContext,
  ParcelQueueInstruction
>;
