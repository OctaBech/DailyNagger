import { useMemo } from "react";
import type { ActionSending, CultureSettings, InteractionStamp, Memory } from "@/services/contracts";
import { useStableCallback } from "@/shared";
import type { ActionScope, RegisteredAction, RuntimeDependenciesForActionScope } from "./actionModel";
import {
  getActionRuntimeDependencies,
  type ActionRuntimeDependencyScreen,
} from "./actionRuntimeDependencies";

type RegisteredActionTree = {
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

type UseRegisteredActionsProps = {
  readonly cultureSettings: CultureSettings;
  readonly editorMemory: Memory;
  readonly planInteractionStamp: InteractionStamp;
  readonly planMemory: Memory;
  readonly sending?: ActionSending;
  readonly screen: ActionRuntimeDependencyScreen;
};

export function useRegisteredActions<TRegistry extends RegisteredActionTree>(
  registry: TRegistry,
  props: UseRegisteredActionsProps,
): RegisteredActionClient<TRegistry> {
  const execute = useStableCallback(
    <TScope extends ActionScope, TActionArgs, TPublicArgs extends unknown[]>(
      action: RegisteredAction<TScope, TActionArgs, TPublicArgs>,
      publicArgs: TPublicArgs,
    ): void => {
      const runtimeDependencies = getActionRuntimeDependencies(props.screen, action.scope, props);
      const actionArgs = action.toActionArgs(...publicArgs);

      action.run(
        actionArgs,
        runtimeDependencies as RuntimeDependenciesForActionScope<TScope>,
      );
    },
  );

  return useMemo(() => {
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
  }, [execute, registry]);
}
