import type { ViewStyle } from "react-native";

type StableCardChrome = {
  readonly borderBottomWidth: number;
  readonly borderLeftWidth: number;
  readonly borderRightWidth: number;
  readonly borderTopWidth: number;
};

type StableCardChromeStyleTokens = {
  readonly background: string;
  readonly border: string;
  readonly chrome: StableCardChrome;
  readonly radius: number;
  readonly selectedBackground: string;
  readonly selectedBorder: string;
};

export function createStableCardChromeStyleObjects({
  background,
  border,
  chrome,
  radius,
  selectedBackground,
  selectedBorder,
}: StableCardChromeStyleTokens): {
  readonly card: ViewStyle;
  readonly selectedCard: ViewStyle;
} {
  return {
    card: {
      backgroundColor: background,
      borderBottomColor: border,
      borderBottomWidth: chrome.borderBottomWidth,
      borderLeftColor: border,
      borderLeftWidth: chrome.borderLeftWidth,
      borderRadius: radius,
      borderRightColor: border,
      borderRightWidth: chrome.borderRightWidth,
      borderTopColor: border,
      borderTopWidth: chrome.borderTopWidth,
    },
    selectedCard: {
      backgroundColor: selectedBackground,
      borderBottomColor: selectedBorder,
      borderLeftColor: selectedBorder,
      borderRightColor: selectedBorder,
      borderTopColor: selectedBorder,
    },
  };
}
