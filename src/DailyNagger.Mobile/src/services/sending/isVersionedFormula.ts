import type { Guid } from "@/shared";
import type { Formula } from "./contracts";

export function isVersionedFormula(
  formula: Formula,
): formula is Formula & { readonly ownerType: "nagger" | "task-log"; readonly ownerId: Guid } {
  return formula.ownerType !== "none" && formula.ownerId !== null;
}
