import type { Parcel } from "../parcel-flow/contracts";

export type MergedParcelVersioning = {
  readonly existingVersion: number | undefined;
  readonly newVersion: number | undefined;
};

export function mergeParcelVersioning(parcels: readonly Parcel[]): MergedParcelVersioning {
  const existingVersions = parcels
    .map((parcel) => parcel.stamp.baseVersion)
    .filter((version) => version !== undefined);

  const newVersions = parcels
    .map((parcel) => parcel.stamp.nextVersion)
    .filter((version) => version !== undefined);

  return {
    existingVersion: existingVersions.length === 0 ? undefined : Math.min(...existingVersions),
    newVersion: newVersions.length === 0 ? undefined : Math.max(...newVersions),
  };
}
