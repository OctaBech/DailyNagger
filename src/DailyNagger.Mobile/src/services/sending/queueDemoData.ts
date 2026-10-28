import { getActiveUserId } from "@/config/activeUserId";
import { environment } from "@/config";
import type { Formula } from "./contracts";

export const demoDataParcelTypes = {
  copy: "demo-data-copy",
  delete: "demo-data-delete",
} as const;

export type DemoDataCommand = {
  readonly type: "demo-data";
  readonly operation: "copy" | "delete";
};

export function createDemoDataFormula(command: DemoDataCommand): Formula {
  return {
    type: demoDataParcelTypes[command.operation],
    label: command.operation === "copy" ? "Add demo data" : "Delete all data",
    ownerType: "none",
    ownerId: null,
    coalesceKey: `DemoData:${command.operation}:${getActiveUserId()}`,
    canBatch: false,
    sendMethod: command.operation === "copy" ? "POST" : "DELETE",
    endpointPath: `/api/demo/data?communityId=${encodeURIComponent(environment.communityId)}&userId=${encodeURIComponent(getActiveUserId())}`,
    recipientExpectsVersioning: false,
    payload: null,
  };
}
