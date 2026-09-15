import { useEffect, useRef, useState } from "react";
import { type Prettify } from "@/shared";
import type { ParcelFlowEvents } from "../sending";

type AssistantBubbleKind = "error" | "success";

type AssistantBubbleMessage = {
  readonly kind: AssistantBubbleKind;
  readonly message: string;
};

export type AssistantBubble = Prettify<ReturnType<typeof useAssistantBubble>>;

export function useAssistantBubble(parcelFlowEvents: ParcelFlowEvents) {
  const [message, setMessage] = useState<AssistantBubbleMessage | null>(null);
  const hasConnectionRef = useRef(true);

  useEffect(() => {
    return parcelFlowEvents.subscribe((eventType) => {
      switch (eventType) {
        case "parcel.batch.failed_to_connect":
          if (hasConnectionRef.current === false) return;
          hasConnectionRef.current = false;
          setMessage({ kind: "error", message: "Connection lost" });
          return;

        case "parcel.batch.sent":
          if (hasConnectionRef.current === true) return;
          hasConnectionRef.current = true;
          setMessage({ kind: "success", message: "Connection restored" });
          return;
      }
    });
  }, [parcelFlowEvents]);

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
