import type { commandActions } from "./commandActions";

export type CommandKind = keyof typeof commandActions;

export type CommandArgs<TKey extends CommandKind> = Parameters<
  (typeof commandActions)[TKey]["run"]
>[0];

export type CommandScopeForKind<TKey extends CommandKind> =
  (typeof commandActions)[TKey]["scope"];

export type PlanScreenCommandArgs<TKey extends CommandKind> = CommandArgs<TKey>;
export type PlanScreenCommandKind = CommandKind;
