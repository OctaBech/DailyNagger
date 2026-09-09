import type { ActionScope } from "./actionRuntimeDependencies";
import type { RegisteredJsxAction } from "@/services/action-boundary/register";

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

export type RegisteredActionClient<TRegistry extends RegisteredActionTree> = {
  readonly [TGroup in keyof TRegistry]: {
    readonly [TName in keyof TRegistry[TGroup]]: TRegistry[TGroup][TName] extends {
      readonly toActionArgs: (...publicArgs: infer TPublicArgs) => unknown;
    }
      ? (...args: TPublicArgs) => void
      : never;
  };
};

type ExecuteRegisteredAction = <TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]>(
  action: RegisteredJsxAction<TScope, TActionArgs, TPublicArgs>,
  publicArgs: TPublicArgs,
) => void;

export function createJsxActions<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  execute: ExecuteRegisteredAction,
): RegisteredActionClient<TRegistry> {
  const client: Record<string, Record<string, (...args: unknown[]) => void>> = {};

  Object.entries(registry).forEach(([groupName, group]) => {
    client[groupName] = {};

    Object.entries(group).forEach(([actionName, action]) => {
      client[groupName][actionName] = (...publicArgs: unknown[]) => {
        execute(action, publicArgs);
      };
    });
  });

  return client as RegisteredActionClient<TRegistry>;
}



