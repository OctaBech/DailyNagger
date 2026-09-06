import type { Nagger } from "@/models";
import type { Guid } from "@/shared";

export type EditorStartEditArgs = {
  readonly naggerId: Guid | null;
};

export type EditorNaggerSessionArgs = {
  readonly nagger: Nagger;
};
