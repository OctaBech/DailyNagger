import type { Tree } from "@/models";
import type { Guid } from "@/shared";
import { treeMutationOperations } from "@/services/core-tree-operations";
import type { OwnerType } from "@/services/sending";

export const versionOperations = {
  getExpectedVersion,
  replaceExpectedVersion,
} as const;

function getExpectedVersion(tree: Tree, ownerType: OwnerType, versionOwnerId: Guid): number {
  switch (ownerType) {
    case "nagger":
      return getNaggerExpectedVersion(tree, versionOwnerId);
    case "task-log":
      return getTaskLogExpectedVersion(tree, versionOwnerId);
  }
}

function getNaggerExpectedVersion(tree: Tree, naggerId: Guid): number {
  const nagger = tree.nags.find((nagger) => nagger.id === naggerId);

  if (nagger === undefined) {
    throw new Error(`Cannot find Nagger ${naggerId}.`);
  }

  return nagger.version;
}

function getTaskLogExpectedVersion(tree: Tree, taskLogId: Guid): number {
  const nagger = tree.nags.find((nagger) => nagger.taskLog.id === taskLogId);

  if (nagger === undefined) {
    throw new Error(`Cannot find Nagger with TaskLog ${taskLogId}.`);
  }

  return nagger.taskLog.version;
}

function replaceExpectedVersion(
  tree: Tree,
  ownerType: OwnerType,
  ownerId: Guid,
  version: number,
  updatedAt: string,
) {
  switch (ownerType) {
    case "nagger":
      return treeMutationOperations.replaceNagger(tree, ownerId, (nagger) => ({
        ...nagger,
        version,
        updatedAt,
      }));

    case "task-log":
      return treeMutationOperations.replaceTaskLog(tree, ownerId, (taskLog) => ({
        ...taskLog,
        version,
        updatedAt,
      }));
  }
}
