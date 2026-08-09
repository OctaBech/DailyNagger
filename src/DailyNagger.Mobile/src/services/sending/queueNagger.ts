import { toJsonValue } from "@/shared";
import type { Formula } from "./contracts";
import type { NaggerDto } from "@/api";

export function createNaggerFormula(nagger: NaggerDto): Formula {
  return {
    type: "nagger-updated",
    label: nagger.title.trim() || "Unnamed nagger",
    ownerType: "nagger",
    ownerId: nagger.id,
    coalesceKey: `Nagger:${nagger.id}`,
    canBatch: false,
    sendMethod: "PUT",
    endpointPath: `/api/nags/${nagger.id}`,
    recipientExpectsVersioning: true,
    payload: toJsonValue({
      id: nagger.id,
      title: nagger.title,
      activeLogDueOn: nagger.activeLogDueOn,
      expiresOn: nagger.expiresOn,
      targetTime: nagger.targetTime,
      isDeactivated: nagger.isDeactivated,
      pinnedBy: nagger.pinnedBy,
      updatedAt: nagger.updatedAt,
      updatedByClientId: nagger.updatedByClientId,
      updatedByDeviceName: nagger.updatedByDeviceName,
      updatedByDeviceModel: nagger.updatedByDeviceModel,
      scheduleRules: nagger.scheduleRules,
      version: nagger.version,
    }),
  };
}
