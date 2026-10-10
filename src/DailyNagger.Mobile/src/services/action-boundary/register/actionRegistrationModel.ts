import type {
  ActionScope,
  RuntimeDependenciesForActionScope,
} from "@/services/action-boundary/action-dependencies";

export type RegisteredAction<TScope extends ActionScope, TActionArgs> = {
  readonly servicePackageName: TScope;
  readonly actionFunction: (
    actionArguments: TActionArgs,
    serviceDependencies: RuntimeDependenciesForActionScope<TScope>,
  ) => void;
};

export function registerAction<TScope extends ActionScope, TActionArgs>(
  actionFunction: (
    actionArguments: TActionArgs,
    serviceDependencies: RuntimeDependenciesForActionScope<TScope>,
  ) => void,
  servicePackageName: TScope,
): RegisteredAction<TScope, TActionArgs> {
  return { actionFunction, servicePackageName };
}
