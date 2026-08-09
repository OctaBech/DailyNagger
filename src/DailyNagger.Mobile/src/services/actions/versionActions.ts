import type { Guid } from "@/shared";
import { versionOperations } from "@/services/operations";
import type { Memory } from "../memory";
import type { OwnerType } from "../sending";

type VersionActionScope = {
  readonly memory: Memory;
};

export function getExpectedVersion(
  { memory }: VersionActionScope,
  versionOwnerType: OwnerType,
  versionOwnerId: Guid,
): number {
  const currentTree = memory.read.getTree();

  return versionOperations.getExpectedVersion(currentTree, versionOwnerType, versionOwnerId);
}

export function replaceExpectedVersion(
  { memory }: VersionActionScope,
  ownerType: OwnerType,
  ownerId: Guid,
  version: number,
  updatedAt: string,
): void {
  const currentTree = memory.read.getTree();

  const treeWithNewVersion = versionOperations.replaceExpectedVersion(
    currentTree,
    ownerType,
    ownerId,
    version,
    updatedAt,
  ).tree;

  memory.write.setTree(treeWithNewVersion);
}

export function updateExpectedVersion(
  { memory }: VersionActionScope,
  ownerType: OwnerType,
  ownerId: Guid,
  updatedAt: string,
): { readonly baseVersion: number; readonly nextVersion: number } {
  const currentTree = memory.read.getTree();

  const baseVersion = versionOperations.getExpectedVersion(currentTree, ownerType, ownerId);
  const nextVersion = baseVersion + 1;

  const { tree: treeWithNewVersion } = versionOperations.replaceExpectedVersion(
    currentTree,
    ownerType,
    ownerId,
    nextVersion,
    updatedAt,
  );

  memory.write.setTree(treeWithNewVersion);

  return { baseVersion, nextVersion };
}

export function forceExpectedVersion(
  { memory }: VersionActionScope,
  ownerType: OwnerType,
  ownerId: Guid,
  serverVersion: number,
  updatedAt: string,
): { readonly baseVersion: number; readonly nextVersion: number } {
  const baseVersion = serverVersion;
  const nextVersion = serverVersion + 1;
  const currentTree = memory.read.tryGetTree();

  if (currentTree === null) return { baseVersion, nextVersion };

  const { tree: treeWithNewVersion } = versionOperations.replaceExpectedVersion(
    currentTree,
    ownerType,
    ownerId,
    nextVersion,
    updatedAt,
  );

  memory.write.setTree(treeWithNewVersion);

  return { baseVersion, nextVersion };
}
