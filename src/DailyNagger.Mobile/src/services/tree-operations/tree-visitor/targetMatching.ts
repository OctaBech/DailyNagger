import type { Guid } from "@/shared";
import type { TreeTarget, VisitRequest } from "./contracts";

export function isRequestTargetUnreachable(
  request: VisitRequest,
  unreachableTargets: readonly TreeTarget["kind"][],
): boolean {
  if (request.kind === "target") return unreachableTargets.includes(request.target.kind);

  return false;
}

export function requestTargetsKind(
  request: VisitRequest,
  targetKind: TreeTarget["kind"],
  id: Guid,
): boolean {
  if (request.kind !== "target") return false;
  if (request.target.kind !== targetKind) return false;

  return request.target.id === id;
}
