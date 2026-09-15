import { useCallback, useMemo, useRef } from "react";
import type { Prettify } from "./typeHelpers";

const allEventsKey = "__all__";

type SubscriberKey<TEventType extends string> = TEventType | typeof allEventsKey;

type EventListener<TEventType extends string, TPayload> = (
  eventType: TEventType,
  payload: TPayload,
) => void;

export function createEventEmitter<TEventType extends string, TPayload>() {
  const subscribers = new Map<
    SubscriberKey<TEventType>,
    Set<EventListener<TEventType, TPayload>>
  >();

  function getOrCreateSubscribers(
    subscriberKey: SubscriberKey<TEventType>,
  ): Set<EventListener<TEventType, TPayload>> {
    const existingSubscribers = subscribers.get(subscriberKey);
    if (existingSubscribers !== undefined) return existingSubscribers;

    const newSubscribers = new Set<EventListener<TEventType, TPayload>>();

    subscribers.set(subscriberKey, newSubscribers);

    return newSubscribers;
  }

  function addSubscriber(
    subscriberKey: SubscriberKey<TEventType>,
    listener: EventListener<TEventType, TPayload>,
  ): () => void {
    const eventSubscribers = getOrCreateSubscribers(subscriberKey);

    eventSubscribers.add(listener);

    return () => {
      eventSubscribers.delete(listener);
    };
  }

  function notifySubscribers(
    subscriberKey: SubscriberKey<TEventType>,
    eventType: TEventType,
    payload: TPayload,
  ): void {
    const eventSubscribers = subscribers.get(subscriberKey);
    if (eventSubscribers === undefined) return;

    for (const subscriber of eventSubscribers) {
      subscriber(eventType, payload);
    }
  }

  function emit(eventType: TEventType, payload: TPayload): void {
    notifySubscribers(allEventsKey, eventType, payload);
    notifySubscribers(eventType, eventType, payload);
  }

  function subscribe(listener: EventListener<TEventType, TPayload>): () => void {
    return addSubscriber(allEventsKey, listener);
  }

  function subscribeTo(
    eventType: TEventType,
    listener: EventListener<TEventType, TPayload>,
  ): () => void {
    return addSubscriber(eventType, listener);
  }

  return {
    emit,
    subscribe,
    subscribeTo,
  };
}

export function useEventEmitter<TEventType extends string, TPayload>() {
  const emitterRef = useRef<ReturnType<typeof createEventEmitter<TEventType, TPayload>> | null>(
    null,
  );

  if (emitterRef.current === null) {
    emitterRef.current = createEventEmitter<TEventType, TPayload>();
  }

  const emit = useCallback((eventType: TEventType, payload: TPayload): void => {
    emitterRef.current?.emit(eventType, payload);
  }, []);

  const subscribe = useCallback((listener: EventListener<TEventType, TPayload>): (() => void) => {
    return emitterRef.current?.subscribe(listener) ?? (() => undefined);
  }, []);

  const subscribeTo = useCallback(
    (eventType: TEventType, listener: EventListener<TEventType, TPayload>): (() => void) => {
      return emitterRef.current?.subscribeTo(eventType, listener) ?? (() => undefined);
    },
    [],
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
  ReturnType<typeof createEventEmitter<TEventType, TPayload>>
>;

export type { EventListener };
