import type {
  ActionScope,
  RuntimeDependenciesForActionScope,
} from "@/services/action-boundary/action-dependencies";

export type RegisteredJsxAction<
  TScope extends ActionScope,
  TActionArgs,
  TPublicArgs extends unknown[],
> = {
  readonly scope: TScope;
  readonly toActionArgs: (...publicArgs: TPublicArgs) => TActionArgs;
  readonly run: (
    args: TActionArgs,
    runtimeDependencies: RuntimeDependenciesForActionScope<TScope>,
  ) => void;
};

export function registerAction<
  TScope extends ActionScope,
  TActionArgs,
  TPublicArgs extends unknown[],
>(
  run: (args: TActionArgs, runtimeDependencies: RuntimeDependenciesForActionScope<TScope>) => void,
  toActionArgs: (...publicArgs: TPublicArgs) => TActionArgs,
  scope: TScope,
): RegisteredJsxAction<TScope, TActionArgs, TPublicArgs> {
  return { scope, run, toActionArgs };
}
