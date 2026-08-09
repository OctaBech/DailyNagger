import type { Tree } from "@/models";

export type TreeReader = {
  readonly read: {
    readonly getTree: () => Tree;
  };
};
