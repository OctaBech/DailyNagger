import type { Memory } from "../../contracts";
import { forceExpectedVersion } from "../../actions";
import type { Parcel } from "../contracts";
import { isVersionedFormula } from "../isVersionedFormula";

type RestampBatchForForcedSendProps = {
  readonly batch: readonly Parcel[];
  readonly versionMemory: Memory;
  readonly serverVersion: number;
};

export function restampBatchForForcedSend({
  batch,
  versionMemory,
  serverVersion,
}: RestampBatchForForcedSendProps): Parcel[] {
  const { formula, stamp } = batch[batch.length - 1];

  if (!isVersionedFormula(formula)) {
    throw new Error("Cannot force send unversioned parcel batch.");
  }

  const { baseVersion, nextVersion } = forceExpectedVersion(
    { memory: versionMemory },
    formula.ownerType,
    formula.ownerId,
    serverVersion,
    stamp.queuedAt,
  );

  return batch.map((parcel) => {
    return {
      ...parcel,
      stamp: { ...parcel.stamp, baseVersion, nextVersion, skipPayloadVersionValidation: true },
    };
  });
}
