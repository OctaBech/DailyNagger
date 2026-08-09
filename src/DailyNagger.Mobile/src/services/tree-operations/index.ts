import { branch } from "./branch";
import { node } from "./node";
import { targets } from "./targets";
import { tree } from "./tree";

export const treeOperations = {
  branch,
  node,
  targets,
  tree,
} as const;

export { branch };
export { node };
export { targets };
export { tree };
export type { TreeReader } from "./contracts";
