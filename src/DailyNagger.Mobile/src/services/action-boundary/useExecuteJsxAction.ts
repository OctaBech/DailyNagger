import { runWithOptionalMiddleware } from "@/middleware";
import { useStableCallback } from "@/shared";
import type {
  ActionRuntimeDependencyScreen,
  ActionScope,
  RuntimeDependencyInputs,
  RuntimeDependenciesForActionScope,
} from "./action-dependencies";
import { getActionRuntimeDependencies } from "./action-dependencies/actionRuntimeDependencies";
import type { ActionEvents, ActionExecutionContext } from "./events";
import type { ActionExecutionWrapper } from "./actionExecutionMiddleware";
import type { JsxAction } from "./jsxActionPackModel";

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
    // Build action arguments from JSX arguments.
    const actionArgs = jsxAction.action.toActionArgs(...jsxAction.publicArgs);

    // Hydrate dependencies for the action scope.
    const runtimeDependencies = getActionRuntimeDependencies(
      environment.screen,
      jsxAction.action.scope,
      environment,
    );

    // Create the causality context for this execution.
    const context = createActionExecutionContext(jsxAction.actionKey, jsxAction.action.scope);

    environment.actionEvents?.emit("action-started", context);

    try {
      // This is an extension point where external tools can wrap the action execution.
      // For example, observability uses this point to start a span.
      // Without a wrapper, run() is called normally.
      const result = runWithOptionalMiddleware(environment.actionExecutionWrapper, context, () =>
        jsxAction.action.run(
          actionArgs,
          runtimeDependencies as RuntimeDependenciesForActionScope<TActionScope>,
        ),
      );

      environment.actionEvents?.emit("action-finished", context);
      return result;
    } catch (error) {
      environment.actionEvents?.emit("action-failed", { ...context, error });
      throw error;
    }
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






