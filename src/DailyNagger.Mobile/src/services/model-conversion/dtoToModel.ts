import type { NagPlanDto, ScheduleRuleDto } from "@/api";
import {
  naggerClientModelExtensionDefaults,
  nagPlanClientModelExtensionDefaults,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
} from "@/models/clientModelExtensions";
import { scheduleRuleDtoToModel } from "@/models";
import { treeMutationOperations } from "@/services/core-tree-operations";

export function nagPlanDtoToTree(nagPlanDto: NagPlanDto) {
  const { tree } = treeMutationOperations.dtoToModel(
    nagPlanDto,
    (nagPlanDtoConvert) => {
      return extendDtoNode(nagPlanDtoConvert, nagPlanClientModelExtensionDefaults);
    },
    (naggerDtoConvert) => {
      return extendDtoNode(
        {
          ...naggerDtoConvert,
          scheduleRules: (naggerDtoConvert.scheduleRules as readonly ScheduleRuleDto[]).map(
            scheduleRuleDtoToModel,
          ),
        },
        naggerClientModelExtensionDefaults,
      );
    },
    (taskLogDtoConvert) => {
      return extendDtoNode(taskLogDtoConvert, taskLogClientModelExtensionDefaults);
    },
    (taskItemDtoConvert) => extendDtoNode(taskItemDtoConvert, taskItemClientModelExtensionDefaults),
    (taskEntryDtoConvert) =>
      extendDtoNode(taskEntryDtoConvert, taskEntryClientModelExtensionDefaults),
  );

  return tree;
}

function extendDtoNode<TDtoNode extends object, TClientExtension extends { clientProps: object }>(
  dtoNode: TDtoNode,
  clientExtensionDefaults: TClientExtension,
): TDtoNode & TClientExtension {
  return {
    ...dtoNode,
    ...clientExtensionDefaults,
    clientProps: {
      ...clientExtensionDefaults.clientProps,
      ...("clientProps" in dtoNode && typeof dtoNode.clientProps === "object"
        ? dtoNode.clientProps
        : {}),
    },
  };
}
