import { postOfficeStripConfig } from "@/config";
import type { Parcel, ParcelFlowEvent, ParcelFlowEventType } from "@/services";
import type { PostOfficeStripState } from "./postOfficeStripModel";
import {
  addQueuedParcels,
  markBatchResult,
  markBatchWaitingAtPostBox,
  markBatchWaitingForUserDecision,
  markCoalescedParcel,
} from "./postOfficeVisualParcel";

export function handleSendingEvent(
  eventType: ParcelFlowEventType,
  event: ParcelFlowEvent,
  state: PostOfficeStripState,
): PostOfficeStripState {
  switch (eventType) {
    case "parcel.queued":
      return {
        ...state,
        visualParcels: addQueuedParcels(state.visualParcels, getEventParcels(event)),
      };

    case "parcel.coalesced":
      return {
        ...state,
        visualParcels: markCoalescedParcel(state.visualParcels, getEventParcels(event)),
      };

    case "parcel.batch.waiting":
      return {
        ...state,
        visualParcels: markBatchWaitingAtPostBox(state.visualParcels, getEventParcels(event)),
      };

    case "parcel.batch.sent":
      return {
        ...state,
        visualParcels: markBatchResult(
          state.visualParcels,
          getEventParcels(event),
          postOfficeStripConfig.sentEmoji,
        ),
        postBoxIsClosed: false,
      };

    case "parcel.batch.failed_to_connect":
      return {
        ...state,
        visualParcels: markBatchWaitingAtPostBox(state.visualParcels, getEventParcels(event)),
        postBoxIsClosed: true,
      };

    case "parcel.batch.blocked_by_version_conflict":
    case "parcel.batch.blocked_by_unrepairable_update":
      return {
        ...state,
        visualParcels: markBatchWaitingForUserDecision(
          state.visualParcels,
          getEventParcels(event),
          postOfficeStripConfig.rejectedEmoji,
        ),
      };

    case "parcel.batch.forced":
      return {
        ...state,
        visualParcels: markBatchResult(
          state.visualParcels,
          getEventParcels(event),
          postOfficeStripConfig.forcedEmoji,
        ),
      };

    case "parcel.batch.discarded":
      return {
        ...state,
        visualParcels: markBatchResult(
          state.visualParcels,
          getEventParcels(event),
          postOfficeStripConfig.discardedEmoji,
        ),
      };

    case "parcel.created":
    case "sending.queue.mmkv_restore_failed":
      return state;
  }
}

function getEventParcels(event: ParcelFlowEvent): readonly Parcel[] {
  if (event.parcels !== undefined) return event.parcels;
  if (event.batch !== undefined) return event.batch.parcels;
  if (event.parcel !== undefined) return [event.parcel];

  return [];
}
