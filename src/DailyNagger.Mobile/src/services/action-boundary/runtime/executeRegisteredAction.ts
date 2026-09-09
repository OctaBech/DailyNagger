import type { ActionScope, RuntimeDependenciesForActionScope } from "./actionRuntimeDependencies";
import {
  getActionRuntimeDependencies,
  type ActionRuntimeDependencyScreen,
} from "./actionRuntimeDependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";
import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";
import {
  createActionExecutionContext,
  runActionWithEvents,
  type ActionEvents,
} from "./actionExecution";

type ExecuteRegisteredActionInput<
  TScope extends ActionScope,
  TActionArgs,
  TPublicArgs extends unknown[],
> = {
  readonly action: RegisteredJsxAction<TScope, TActionArgs, TPublicArgs>;
  readonly actionEvents?: ActionEvents;
  readonly actionKey: string;
  readonly publicArgs: TPublicArgs;
  readonly runtimeDependencyInputs: RuntimeDependencyInputs;
  readonly screen: ActionRuntimeDependencyScreen;
};

export function executeRegisteredAction<
  TScope extends ActionScope,
  TActionArgs,
  TPublicArgs extends unknown[],
>({
  action,
  actionEvents,
  actionKey,
  publicArgs,
  runtimeDependencyInputs,
  screen,
}: ExecuteRegisteredActionInput<TScope, TActionArgs, TPublicArgs>): void {
  const actionArgs = action.toActionArgs(...publicArgs);
  const runtimeDependencies = getActionRuntimeDependencies(screen, action.scope, runtimeDependencyInputs);
  const context = createActionExecutionContext({ actionKey, actionScope: action.scope });

  runActionWithEvents(actionEvents, context, () =>
    action.run(
      actionArgs,
      runtimeDependencies as RuntimeDependenciesForActionScope<TScope>,
    ),
  );
}



