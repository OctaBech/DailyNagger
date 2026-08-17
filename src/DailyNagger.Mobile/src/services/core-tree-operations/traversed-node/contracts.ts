// TraversedNode contracts describe nodes while they are being traversed.
// They are allowed to be between DTO and client model.
// Visitors are responsible for returning a fully valid output node.

import type { NagPlanDto, NaggerDto, TaskLogDto, TaskItemDto, TaskEntryDto } from "@/api";
import type { ScheduleRule } from "@/models";
import type {
  ClientModel,
  ClientNodeType,
  NaggerClientModelExtension,
  NagPlanClientModelExtension,
  TaskEntryClientModelExtension,
  TaskItemClientModelExtension,
  TaskLogClientModelExtension,
} from "@/models/clientModelExtensions";
import type { Immutable } from "@/shared";

type PartialClientModelExtension<
  TExtension extends ClientModel<object, ClientNodeType>,
> = Immutable<{
  readonly nodeType?: TExtension["nodeType"];
  readonly clientProps?: Partial<TExtension["clientProps"]>;
}>;

export type TraversedNode =
  | NagPlanTraversedNode
  | NaggerTraversedNode
  | TaskLogTraversedNode
  | TaskItemTraversedNode
  | TaskEntryTraversedNode;

export type NagPlanTraversedNode = Immutable<
  NagPlanDto<NaggerTraversedNode> & PartialClientModelExtension<NagPlanClientModelExtension>
>;

export type NaggerTraversedNode = Immutable<
  Omit<NaggerDto<TaskLogTraversedNode>, "scheduleRules"> & {
    readonly scheduleRules: readonly NaggerDto["scheduleRules"][number][] | readonly ScheduleRule[];
  } & PartialClientModelExtension<NaggerClientModelExtension>
>;

export type TaskLogTraversedNode = Immutable<
  TaskLogDto<TaskItemTraversedNode> & PartialClientModelExtension<TaskLogClientModelExtension>
>;

export type TaskItemTraversedNode = TaskItemDto<
  TaskItemTraversedNode,
  TaskEntryTraversedNode
> &
  PartialClientModelExtension<TaskItemClientModelExtension>;

export type TaskEntryTraversedNode = Immutable<
  TaskEntryDto & PartialClientModelExtension<TaskEntryClientModelExtension>
>;
