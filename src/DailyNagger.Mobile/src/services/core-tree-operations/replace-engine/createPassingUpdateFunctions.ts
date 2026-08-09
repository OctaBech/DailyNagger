import type {
  NagPlanTraversedNode,
  NaggerTraversedNode,
  TaskLogTraversedNode,
  TaskItemTraversedNode,
  TaskEntryTraversedNode,
} from "../traversed-node/contracts";
import type { ReplaceFunctions } from "./contracts";

export function createPassingUpdateFunctions(): ReplaceFunctions {
  return {
    replaceNagPlanNodeFn: (nagPlan: NagPlanTraversedNode) => nagPlan,
    replaceNaggerNodeFn: (nagger: NaggerTraversedNode) => nagger,
    replaceTaskLogNodeFn: (taskLog: TaskLogTraversedNode) => taskLog,
    replaceTaskItemNodeFn: (taskItem: TaskItemTraversedNode) => taskItem,
    replaceTaskEntryNodeFn: (taskEntry: TaskEntryTraversedNode) => taskEntry,
  };
}

