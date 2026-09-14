# Parcel Flow

This folder owns the A-to-B sending flow.

The intended story is:

1. `useCreateParcel` turns sendable content into a parcel.
2. `useParcelQueue` owns queue mechanics, persistence, batching, timer/backoff, and queue events.
3. `useSendParcelBatch` sends one batch and returns what the queue should do next.

Keep the flow readable from parcel creation, through queueing, to batch sending.
Do not mix partial old/new sending paths in this folder.
