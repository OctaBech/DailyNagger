import {
  runWithMiddleware,
  type MiddlewareExecutionContext,
  type MiddlewareWrapperFunction,
} from "@/middleware";
import { useStableCallback } from "@/shared";
import type {
  ActionRuntimeDependencyScreen,
  ActionScope,
  RuntimeDependencyInputs,
  RuntimeDependenciesForActionScope,
} from "./action-dependencies";
import { getActionRuntimeDependencies } from "./action-dependencies/actionRuntimeDependencies";
import type { ActionEvents } from "./events";
import type { JsxAction } from "./jsxActionPackModel";

type UseExecuteJsxActionProps = RuntimeDependencyInputs & {
  readonly actionEvents?: ActionEvents;
  readonly middlewareWrapperFunction: MiddlewareWrapperFunction;
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

    const executionContexts: MiddlewareExecutionContext[] = [];

    try {
      return runWithMiddleware(
        `action/${jsxAction.actionKey}:${new Date().toISOString()}`,
        (context) => {
          executionContexts.push(context);
          environment.actionEvents?.emit("action-started", context);

          jsxAction.action.run(
            actionArgs,
            runtimeDependencies as RuntimeDependenciesForActionScope<TActionScope>,
          );

          environment.actionEvents?.emit("action-finished", context);
        },
        environment.middlewareWrapperFunction,
        {
          actionKey: jsxAction.actionKey,
          actionScope: jsxAction.action.scope,
        },
      );
    } catch (error) {
      const activeContext = executionContexts[0];

      environment.actionEvents?.emit("action-failed", {
        causalityKey: activeContext?.causalityKey ?? `action/${jsxAction.actionKey}:failed-before-context`,
        error,
        metadata: activeContext?.metadata ?? {
          actionKey: jsxAction.actionKey,
          actionScope: jsxAction.action.scope,
        },
      });
      throw error;
    }
  }

  return useStableCallback(executeJsxAction);
}
