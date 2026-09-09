import type { NagPlanDto, NaggerDto, TaskLogDto } from "@/api";
import type { NagPlan, Nagger, ScheduleRule, TaskLog } from "@/models";
import { scheduleRuleModelToDto } from "@/models";
import {
  naggerClientModelExtensionDefaults,
  nagPlanClientModelExtensionDefaults,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
} from "@/models/clientModelExtensions";
import { treeOperations } from "@/services/tree-operations";

export function nagPlanToDto(nagPlan: NagPlan): NagPlanDto {
  return treeOperations.modelConversion.replaceAllNodes<NagPlan, NagPlanDto>(nagPlan, {
    replaceNagPlan: (nagPlanToDto) => {
      return stripClientModelExtension(nagPlanToDto, nagPlanClientModelExtensionDefaults);
    },
    replaceNagger: (naggerToDto) => {
      return stripClientModelExtension(
        {
          ...naggerToDto,
          scheduleRules: (naggerToDto.scheduleRules as readonly ScheduleRule[]).map(
            scheduleRuleModelToDto,
          ),
        },
        naggerClientModelExtensionDefaults,
      );
    },
    replaceTaskLog: (taskLogToDto) => {
      return stripClientModelExtension(taskLogToDto, taskLogClientModelExtensionDefaults);
    },
    replaceTaskItem: (taskItemToDto) => {
      return stripClientModelExtension(taskItemToDto, taskItemClientModelExtensionDefaults);
    },
    replaceTaskEntry: (taskEntryToDto) => {
      return stripClientModelExtension(taskEntryToDto, taskEntryClientModelExtensionDefaults);
    },
  });
}

export function naggerToDto(nagger: Nagger): NaggerDto {
  return {
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
    scheduleRules: nagger.scheduleRules.map(scheduleRuleModelToDto),
    version: nagger.version,
  };
}

export function taskLogToDto(taskLog: TaskLog): TaskLogDto {
  return treeOperations.modelConversion.replaceAllNodesFromTaskLog<TaskLog, TaskLogDto>(taskLog, {
    replaceTaskLog: (taskLogToDto) => {
      return stripClientModelExtension(taskLogToDto, taskLogClientModelExtensionDefaults);
    },
    replaceTaskItem: (taskItemToDto) => {
      return stripClientModelExtension(taskItemToDto, taskItemClientModelExtensionDefaults);
    },
    replaceTaskEntry: (taskEntryToDto) => {
      return stripClientModelExtension(taskEntryToDto, taskEntryClientModelExtensionDefaults);
    },
  });
}

function stripClientModelExtension<TDtoNode extends object>(
  clientNode: object,
  clientExtensionDefaults: object,
): TDtoNode {
  const dtoNode = { ...clientNode } as Record<string, unknown>;

  for (const clientPropName of Object.keys(clientExtensionDefaults)) {
    delete dtoNode[clientPropName];
  }

  return dtoNode as TDtoNode;
}

