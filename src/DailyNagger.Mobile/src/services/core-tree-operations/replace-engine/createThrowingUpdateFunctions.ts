import type { ReplaceAction, ReplaceFunctions } from "./contracts";

export function createThrowingUpdateFunctions(expectedAction: ReplaceAction): ReplaceFunctions {
  return {
    replaceNagPlanNodeFn: () => {
      throw new Error(`Expected ${expectedAction}, got NagPlan`);
    },
    replaceNaggerNodeFn: () => {
      throw new Error(`Expected ${expectedAction}, got Nagger`);
    },
    replaceTaskLogNodeFn: () => {
      throw new Error(`Expected ${expectedAction}, got TaskLog`);
    },
    replaceTaskItemNodeFn: () => {
      throw new Error(`Expected ${expectedAction}, got TaskItem`);
    },
    replaceTaskEntryNodeFn: () => {
      throw new Error(`Expected ${expectedAction}, got TaskEntry`);
    },
  };
}
