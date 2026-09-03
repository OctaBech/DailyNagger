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
import { treeOperations } from "@/services/tree-operations";

export function nagPlanToDto(nagPlan: NagPlan): NagPlanDto {
  return treeOperations.tree.replaceAllNodes<NagPlan, NagPlanDto>(nagPlan, {
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
  const nagPlanDto = nagPlanToDto({
    date: "",
    nags: [nagger],
    ...nagPlanClientModelExtensionDefaults,
  });

  return requireSingleNagger<NaggerDto>(nagPlanDto);
}

export function taskLogToDto(taskLog: TaskLog): TaskLogDto {
  const nagPlanDto = nagPlanToDto({
    date: "",
    nags: [createTaskLogNagger(taskLog)],
    ...nagPlanClientModelExtensionDefaults,
  });

  return requireSingleNagger<NagPlanNaggerDto>(nagPlanDto).taskLog;
}

function requireSingleNagger<TNagger extends NaggerDto | NagPlanNaggerDto>(
  nagPlanDto: NagPlanDto,
): TNagger {
  const nagger = nagPlanDto.nags[0];

  if (nagger === undefined) {
    throw new Error("Expected NagPlan DTO to contain one Nagger.");
  }

  return nagger as TNagger;
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
