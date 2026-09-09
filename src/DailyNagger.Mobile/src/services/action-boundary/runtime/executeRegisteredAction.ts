import type { ActionScope, RuntimeDependenciesForActionScope } from "./actionRuntimeDependencies";
import {
  getActionRuntimeDependencies,
  type ActionRuntimeDependencyScreen,
} from "./actionRuntimeDependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";
import type { RuntimeDependencyInputs } from "./runtimeDependencyInputs";

type ExecuteRegisteredActionInput<
  TScope extends ActionScope,
  TActionArgs,
  TPublicArgs extends unknown[],
> = {
  readonly action: RegisteredJsxAction<TScope, TActionArgs, TPublicArgs>;
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
  publicArgs,
  runtimeDependencyInputs,
  screen,
}: ExecuteRegisteredActionInput<TScope, TActionArgs, TPublicArgs>): void {
  const actionArgs = action.toActionArgs(...publicArgs);
  const runtimeDependencies = getActionRuntimeDependencies(screen, action.scope, runtimeDependencyInputs);

  action.run(
    actionArgs,
    runtimeDependencies as RuntimeDependenciesForActionScope<TScope>,
  );
}


