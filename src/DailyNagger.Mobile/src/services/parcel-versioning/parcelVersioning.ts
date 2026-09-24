import type { Memory } from "@/services/memory";
import { treeOperations } from "@/services/tree-operations";
import type { Guid } from "@/shared";
import type { Formula, OwnerType } from "@/services/sending/contracts";
import type { Parcel } from "@/services/sending/parcel-flow";

type VersionedFormula = Formula & {
  readonly ownerType: OwnerType;
  readonly ownerId: Guid;
};

type ParcelVersionStamp = {
  readonly baseVersion: number;
  readonly nextVersion: number;
};

type CreateParcelVersionStampProps = {
  readonly memory: Memory;
  readonly formula: Formula;
  readonly queuedAt: string;
};

type RestampBatchForForcedSendProps = {
  readonly batch: readonly Parcel[];
  readonly memory: Memory;
  readonly serverVersion: number;
};

export function createParcelVersionStamp({
  memory,
  formula,
  queuedAt,
}: CreateParcelVersionStampProps): ParcelVersionStamp {
  const versionedFormula = requireVersionedFormula(formula);
  const baseVersion = getExpectedVersion(memory, versionedFormula);
  const nextVersion = baseVersion + 1;

  replaceExpectedVersion(memory, versionedFormula, nextVersion, queuedAt);

  return { baseVersion, nextVersion };
}

export function restampBatchForForcedSend({
  batch,
  memory,
  serverVersion,
}: RestampBatchForForcedSendProps): Parcel[] {
  const { formula, stamp } = batch[batch.length - 1];
  const versionedFormula = requireVersionedFormula(formula);
  const baseVersion = serverVersion;
  const nextVersion = serverVersion + 1;

  if (memory.read.tryGetTree() !== null) {
    replaceExpectedVersion(memory, versionedFormula, nextVersion, stamp.queuedAt);
  }

  return batch.map((parcel) => {
    return {
      ...parcel,
      stamp: { ...parcel.stamp, baseVersion, nextVersion, skipPayloadVersionValidation: true },
    };
  });
}

function requireVersionedFormula(formula: Formula): VersionedFormula {
  if (formula.ownerType === "none" || formula.ownerId === null) {
    throw new Error(
      "Cannot version parcel formula because the recipient expects versioning but the formula has no version owner.",
    );
  }

  return formula as VersionedFormula;
}

function getExpectedVersion(memory: Memory, formula: VersionedFormula): number {
  const { tree } = treeOperations;

  switch (formula.ownerType) {
    case "nagger":
      return tree.readNagger(memory, formula.ownerId).freshNagger.version;
    case "task-log":
      return tree.readTaskLog(memory, formula.ownerId).freshTaskLog.version;
  }
}

function replaceExpectedVersion(
  memory: Memory,
  formula: VersionedFormula,
  version: number,
  updatedAt: string,
): void {
  const { tree } = treeOperations;

  switch (formula.ownerType) {
    case "nagger": {
      const { freshTree, freshNagger } = tree.readNagger(memory, formula.ownerId);
      const naggerV1 = { ...freshNagger, version, updatedAt };
      const treeV1 = tree.replaceNagger(freshTree, naggerV1);

      memory.write.setTree(treeV1);
      break;
    }
    case "task-log": {
      const { freshTree, freshTaskLog } = tree.readTaskLog(memory, formula.ownerId);
      const taskLogV1 = { ...freshTaskLog, version, updatedAt };
      const treeV1 = tree.replaceNode(freshTree, taskLogV1).newTree;

      memory.write.setTree(treeV1);
      break;
    }
  }
}
