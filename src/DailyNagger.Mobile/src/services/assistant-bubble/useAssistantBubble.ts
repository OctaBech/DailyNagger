import { useEffect, useRef, useState } from "react";
import { type EventEmitter, type Prettify } from "@/shared";
import type { Parcel, SendingEventType } from "../sending";

type AssistantBubbleKind = "error" | "success";

type AssistantBubbleMessage = {
  readonly kind: AssistantBubbleKind;
  readonly message: string;
};

export type AssistantBubble = Prettify<ReturnType<typeof useAssistantBubble>>;

export function useAssistantBubble(
  sendingEvents: EventEmitter<SendingEventType, readonly Parcel[]>,
) {
  const [message, setMessage] = useState<AssistantBubbleMessage | null>(null);
  const hasConnectionRef = useRef(true);

  useEffect(() => {
    return sendingEvents.subscribe((eventType) => {
      switch (eventType) {
        case "batch-failed-to-connect":
          if (hasConnectionRef.current === false) return;
          hasConnectionRef.current = false;
          setMessage({ kind: "error", message: "Connection lost" });
          return;

        case "batch-sent":
          if (hasConnectionRef.current === true) return;
          hasConnectionRef.current = true;
          setMessage({ kind: "success", message: "Connection restored" });
          return;
      }
    });
  }, [sendingEvents]);

  function hasMessage(): boolean {
    return message !== null;
  }

  function getMessageText(): string {
    return message?.message ?? "";
  }

  function isMessageKind(kind: AssistantBubbleKind): boolean {
    return message?.kind === kind;
  }

  function dismiss(): void {
    setMessage(null);
  }

  return {
    hasMessage,
    getMessageText,
    isMessageKind,
    dismiss,
  };
}
