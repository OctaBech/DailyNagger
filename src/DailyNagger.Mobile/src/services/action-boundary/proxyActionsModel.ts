import type { ActionScope } from "./action-dependencies";
import type { RegisteredAction } from "@/services/action-boundary/register";

// Model for registering actions in the boundary between services and JSX.
export type RegisteredActionTree = {
  readonly [group: string]: {
    readonly [name: string]: AnyRegisteredAction;
  };
};

type AnyRegisteredAction = {
  readonly servicePackageName: ActionScope;
  readonly actionFunction: (actionArguments: any, serviceDependencies: any) => void;
};

// The function pack JSX receives after the registry has been bound to the action boundary.
export type ProxyActions<TRegistry extends RegisteredActionTree> = {
  readonly [TGroup in keyof TRegistry]: {
    readonly [TName in keyof TRegistry[TGroup]]: TRegistry[TGroup][TName] extends {
      readonly actionFunction: (
        actionArguments: infer TActionArgs,
        serviceDependencies: any,
      ) => void;
    }
      ? (actionArguments: TActionArgs) => void
      : never;
  };
};

// One concrete action call from JSX, before runtime dependencies have been hydrated.
export type ActionInvocation<
  TActionScope extends ActionScope = ActionScope,
  TActionArgs = unknown,
> = {
  readonly action: RegisteredAction<TActionScope, TActionArgs>;
  readonly actionKey: string;
  readonly actionArguments: TActionArgs;
};

// The executor receives exactly one JSX action and runs it through the boundary.
export type ExecuteAction = <TActionScope extends ActionScope, TActionArgs>(
  actionInvocation: ActionInvocation<TActionScope, TActionArgs>,
) => void;
