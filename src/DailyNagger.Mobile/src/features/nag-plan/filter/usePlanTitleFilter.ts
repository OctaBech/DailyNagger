import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { usePlanFilterRequests } from "./PlanFilterRequests";

// Only this screen subscribes to filter text. Services and AppShell receive no keystrokes.
export function usePlanTitleFilter() {
  const requests = usePlanFilterRequests();
  const [isVisible, setIsVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [focusRequest, setFocusRequest] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(
    () =>
      requests.subscribeTo("open", () => {
        setIsVisible(true);
        setFocusRequest((current) => current + 1);
      }),
    [requests],
  );

  function close() {
    Keyboard.dismiss();
    setQuery("");
    setIsVisible(false);
    setIsInputFocused(false);
  }

  return {
    isVisible,
    query,
    setQuery,
    focusRequest,
    isInputFocused,
    setIsInputFocused,
    close,
  };
}
