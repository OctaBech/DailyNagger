import { useCallback, useMemo, useRef } from "react";
import type { Prettify } from "./typeHelpers";

const allEventsKey = "__all__";

type SubscriberKey<TEventType extends string> = TEventType | typeof allEventsKey;

type EventListener<TEventType extends string, TPayload> = (
  eventType: TEventType,
  payload: TPayload,
) => void;

export function useEventEmitter<TEventType extends string, TPayload>() {
  const subscribersRef = useRef(
    new Map<SubscriberKey<TEventType>, Set<EventListener<TEventType, TPayload>>>(),
  );

  const getOrCreateSubscribers = useCallback(
    (subscriberKey: SubscriberKey<TEventType>): Set<EventListener<TEventType, TPayload>> => {
      const existingSubscribers = subscribersRef.current.get(subscriberKey);
      if (existingSubscribers !== undefined) return existingSubscribers;

      const newSubscribers = new Set<EventListener<TEventType, TPayload>>();

      subscribersRef.current.set(subscriberKey, newSubscribers);

      return newSubscribers;
    },
    [],
  );

  const addSubscriber = useCallback(
    (
      subscriberKey: SubscriberKey<TEventType>,
      listener: EventListener<TEventType, TPayload>,
    ): (() => void) => {
      const subscribers = getOrCreateSubscribers(subscriberKey);

      subscribers.add(listener);

      return () => {
        subscribers.delete(listener);
      };
    },
    [getOrCreateSubscribers],
  );

  const notifySubscribers = useCallback(
    (subscriberKey: SubscriberKey<TEventType>, eventType: TEventType, payload: TPayload): void => {
      const subscribers = subscribersRef.current.get(subscriberKey);
      if (subscribers === undefined) return;

      for (const subscriber of subscribers) {
        subscriber(eventType, payload);
      }
    },
    [],
  );

  const emit = useCallback(
    (eventType: TEventType, payload: TPayload): void => {
      notifySubscribers(allEventsKey, eventType, payload);
      notifySubscribers(eventType, eventType, payload);
    },
    [notifySubscribers],
  );

  const subscribe = useCallback(
    (listener: EventListener<TEventType, TPayload>): (() => void) => {
      return addSubscriber(allEventsKey, listener);
    },
    [addSubscriber],
  );

  const subscribeTo = useCallback(
    (eventType: TEventType, listener: EventListener<TEventType, TPayload>): (() => void) => {
      return addSubscriber(eventType, listener);
    },
    [addSubscriber],
  );

  return useMemo(
    () => ({
      emit,
      subscribe,
      subscribeTo,
    }),
    [emit, subscribe, subscribeTo],
  );
}

export type EventEmitter<TEventType extends string, TPayload> = Prettify<
  ReturnType<typeof useEventEmitter<TEventType, TPayload>>
>;

export type { EventListener };
