import type { ActionScope } from "./action-dependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";

// Model for registering actions in the boundary between services and JSX.
export type RegisteredActionTree = {
  readonly [group: string]: {
    readonly [name: string]: AnyRegisteredAction;
  };
};

type AnyRegisteredAction = {
  readonly scope: ActionScope;
  readonly toActionArgs: (...publicArgs: any[]) => any;
  readonly run: (args: any, runtimeDependencies: any) => void;
};

// The function pack JSX receives after the registry has been bound to the action boundary.
export type JsxActionPack<TRegistry extends RegisteredActionTree> = {
  readonly [TGroup in keyof TRegistry]: {
    readonly [TName in keyof TRegistry[TGroup]]: TRegistry[TGroup][TName] extends {
      readonly toActionArgs: (...publicArgs: infer TJsxArgs) => unknown;
    }
      ? (...args: TJsxArgs) => void
      : never;
  };
};

// One concrete action call from JSX, before runtime dependencies have been hydrated.
export type JsxAction<
  TActionScope extends ActionScope = ActionScope,
  TActionArgs = unknown,
  TJsxArgs extends unknown[] = unknown[],
> = {
  readonly action: RegisteredJsxAction<TActionScope, TActionArgs, TJsxArgs>;
  readonly actionKey: string;
  readonly publicArgs: TJsxArgs;
};

// The executor receives exactly one JSX action and runs it through the boundary.
export type ExecuteJsxAction = <
  TActionScope extends ActionScope,
  TActionArgs,
  TJsxArgs extends unknown[],
>(
  jsxAction: JsxAction<TActionScope, TActionArgs, TJsxArgs>,
) => void;

