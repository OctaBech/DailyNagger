import type { Guid } from "@/shared";

export type VisualParcel = {
  readonly parcelId: Guid;
  readonly slot: number;
  readonly status: VisualParcelStatus;
  readonly walkingEmoji: string;
  readonly standingEmoji: string;
  readonly exitEmoji: string;
  readonly canPassPostBox: boolean;
  readonly waitingSince: string;
};

export type VisualParcelStatus = "walking" | "standing" | "exiting";

export type PostOfficeStripState = {
  readonly visualParcels: readonly VisualParcel[];
  readonly postBoxIsClosed: boolean;
};
