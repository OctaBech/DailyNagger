import type { NagPlanDto, NaggerDto, NagPlanNaggerDto, TaskLogDto } from "@/api";
import type { NagPlan, Nagger, ScheduleRule, TaskLog } from "@/models";
import { scheduleRuleModelToDto } from "@/models";
import {
  naggerClientModelExtensionDefaults,
  nagPlanClientModelExtensionDefaults,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
} from "@/models/clientModelExtensions";
import { treeMutationOperations, treeReadOperations } from "@/services/core-tree-operations";

export function nagPlanToDto(nagPlan: NagPlan): NagPlanDto {
  const { tree: nagPlanDto } = treeMutationOperations.modelToDto(
    nagPlan,
    (nagPlanToDto) => {
      return stripClientModelExtension(nagPlanToDto, nagPlanClientModelExtensionDefaults);
    },
    (naggerToDto) => {
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
    (taskLogToDto) => {
      return stripClientModelExtension(taskLogToDto, taskLogClientModelExtensionDefaults);
    },
    (taskItemToDto) => {
      return stripClientModelExtension(taskItemToDto, taskItemClientModelExtensionDefaults);
    },
    (taskEntryToDto) => {
      return stripClientModelExtension(taskEntryToDto, taskEntryClientModelExtensionDefaults);
    },
  );

  return nagPlanDto as NagPlanDto;
}

export function naggerToDto(nagger: Nagger): NaggerDto {
  const nagPlanDto = nagPlanToDto({
    date: "",
    nags: [nagger],
    ...nagPlanClientModelExtensionDefaults,
  });

  return treeReadOperations.requireSingleNagger<NaggerDto>(nagPlanDto);
}

export function taskLogToDto(taskLog: TaskLog): TaskLogDto {
  const nagPlanDto = nagPlanToDto({
    date: "",
    nags: [createTaskLogNagger(taskLog)],
    ...nagPlanClientModelExtensionDefaults,
  });

  return treeReadOperations.requireSingleNagger<NagPlanNaggerDto>(nagPlanDto).taskLog;
}

function createTaskLogNagger(taskLog: TaskLog): Nagger {
  return {
    id: taskLog.nagId,
    title: "",
    updatedAt: "",
    updatedByClientId: null,
    updatedByDeviceName: null,
    updatedByDeviceModel: null,
    activeLogDueOn: null,
    expiresOn: null,
    targetTime: null,
    isDeactivated: false,
    pinnedBy: "None",
    scheduleRules: [],
    taskLog,
    version: 0,
    ...naggerClientModelExtensionDefaults,
  };
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
