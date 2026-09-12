import { useStableCallback } from "@/shared";
import type { RuntimeDependencyInputs } from "./action-dependencies";
import type {
  ActionRuntimeDependencyScreen,
  ActionScope,
  RuntimeDependenciesForActionScope,
} from "./action-dependencies";
import { getActionRuntimeDependencies } from "./action-dependencies/actionRuntimeDependencies";
import type { ActionEvents, ActionExecutionContext, ActionExecutionWrapper } from "./events";
import type { JsxAction } from "./useBuildJsxActionPack";

type UseExecuteJsxActionProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly actionExecutionWrapper?: ActionExecutionWrapper;
  readonly screen: ActionRuntimeDependencyScreen;
};

export function useExecuteJsxAction(props: UseExecuteJsxActionProps) {
  const environment = props;

  function executeJsxAction<TActionScope extends ActionScope, TActionArgs, TJsxArgs extends unknown[]>(
    jsxAction: JsxAction<TActionScope, TActionArgs, TJsxArgs>,
  ): void {
    const actionArgs = jsxAction.action.toActionArgs(...jsxAction.publicArgs);
    const runtimeDependencies = getActionRuntimeDependencies(
      environment.screen,
      jsxAction.action.scope,
      environment,
    );
    const context = createActionExecutionContext(jsxAction.actionKey, jsxAction.action.scope);

    runActionWithEvents(environment, context, () =>
      jsxAction.action.run(
        actionArgs,
        runtimeDependencies as RuntimeDependenciesForActionScope<TActionScope>,
      ),
    );
  }

  return useStableCallback(executeJsxAction);
}

function createActionExecutionContext(
  actionKey: string,
  actionScope: ActionScope,
): ActionExecutionContext {
  const startedAt = new Date().toISOString();

  return {
    actionKey,
    actionScope,
    causalityKey: `${actionKey}:${startedAt}`,
    startedAt,
  };
}

function runActionWithEvents<TResult>(
  props: UseExecuteJsxActionProps,
  context: ActionExecutionContext,
  run: () => TResult,
): TResult {
  props.actionEvents?.emit("action-started", context);

  try {
    const result = (props.actionExecutionWrapper ?? runActionWithoutWrapping)(context, run);
    props.actionEvents?.emit("action-finished", context);
    return result;
  } catch (error) {
    props.actionEvents?.emit("action-failed", { ...context, error });
    throw error;
  }
}

const runActionWithoutWrapping: ActionExecutionWrapper = (_context, run) => run();




