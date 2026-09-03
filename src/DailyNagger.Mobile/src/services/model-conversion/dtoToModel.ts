import type { NagPlanDto, ScheduleRuleDto } from "@/api";
import {
  naggerClientModelExtensionDefaults,
  nagPlanClientModelExtensionDefaults,
  taskEntryClientModelExtensionDefaults,
  taskItemClientModelExtensionDefaults,
  taskLogClientModelExtensionDefaults,
} from "@/models/clientModelExtensions";
import { scheduleRuleDtoToModel, type Tree } from "@/models";
import { treeOperations } from "@/services/tree-operations";

export function nagPlanDtoToTree(nagPlanDto: NagPlanDto) {
  return treeOperations.tree.replaceAllNodes<NagPlanDto, Tree>(nagPlanDto, {
    replaceNagPlan: (nagPlanDtoConvert) => {
      return extendDtoNode(nagPlanDtoConvert, nagPlanClientModelExtensionDefaults);
    },
    replaceNagger: (naggerDtoConvert) => {
      return extendDtoNode(
        {
          ...naggerDtoConvert,
          scheduleRules: naggerDtoConvert.scheduleRules.map(scheduleRuleToModel),
        },
        naggerClientModelExtensionDefaults,
      );
    },
    replaceTaskLog: (taskLogDtoConvert) => {
      return extendDtoNode(taskLogDtoConvert, taskLogClientModelExtensionDefaults);
    },
    replaceTaskItem: (taskItemDtoConvert) =>
      extendDtoNode(taskItemDtoConvert, taskItemClientModelExtensionDefaults),
    replaceTaskEntry: (taskEntryDtoConvert) =>
      extendDtoNode(taskEntryDtoConvert, taskEntryClientModelExtensionDefaults),
  });
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

function scheduleRuleToModel(
  scheduleRule: ScheduleRuleDto | ReturnType<typeof scheduleRuleDtoToModel>,
) {
  if ("rule" in scheduleRule) return scheduleRule;

  return scheduleRuleDtoToModel(scheduleRule);
}
