import type { TextStyle, ViewStyle } from "react-native";

const letsGoMood = {
  label: "Let's go",
  emoji: "😀",
  bubble: {
    backgroundColor: "#ffe082",
    borderColor: "#f2b84b",
    borderRadius: 16,
  },
  text: {
    color: "#5a3b00",
    fontFamily: "serif",
    fontSize: 13,
    fontWeight: "900",
  },
} as const;

const ouchMood = {
  label: "Ouch",
  emoji: "🤕",
  bubble: {
    backgroundColor: "#f4f1ed",
    borderColor: "#d85d5d",
    borderRadius: 5,
    borderWidth: 2,
  },
  text: {
    color: "#9b2929",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "800",
  },
} as const;

const yawnMood = {
  label: "Yawn",
  emoji: "🥱",
  bubble: {
    backgroundColor: "#d8cff0",
    borderColor: "#a79ac9",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  text: {
    color: "#4d416a",
    fontFamily: "serif",
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "700",
  },
} as const;

const sleepModeMood = {
  label: "Sleep mode",
  emoji: "😴",
  bubble: {
    backgroundColor: "#b8bec7",
    borderColor: "#8b929d",
    borderRadius: 18,
    opacity: 0.92,
  },
  text: {
    color: "#28313a",
    fontFamily: "serif",
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "700",
  },
} as const;

const bathroomBreakMood = {
  label: "Bathroom break",
  emoji: "💩",
  bubble: {
    backgroundColor: "#6f4a34",
    borderColor: "#94613f",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 16,
  },
  text: {
    color: "#ffe0ad",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "800",
  },
} as const;

const whatAWorldMood = {
  label: "What a world",
  emoji: "😭",
  bubble: {
    backgroundColor: "#263b6f",
    borderColor: "#6d8ad8",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
  },
  text: {
    color: "#aee6ff",
    fontFamily: "serif",
    fontSize: 13,
    fontWeight: "800",
  },
} as const;

const letsPartyMood = {
  label: "Let's party",
  emoji: "🥳",
  bubble: {
    backgroundColor: "#332048",
    borderColor: "#e2be57",
    borderRadius: 14,
    borderWidth: 2,
  },
  text: {
    color: "#6cff7d",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
} as const;

const notSureMood = {
  label: "Not sure",
  emoji: "😨",
  bubble: {
    backgroundColor: "#c9e7ee",
    borderColor: "#86b9c7",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  text: {
    color: "#214954",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "800",
  },
} as const;

const grrrMood = {
  label: "Grrr",
  emoji: "😡",
  bubble: {
    backgroundColor: "#5b1714",
    borderColor: "#f06148",
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 4,
    borderWidth: 2,
  },
  text: {
    color: "#ffcf5f",
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: "900",
  },
} as const;

const sniffleModeMood = {
  label: "Sniffle mode",
  emoji: "🤧",
  bubble: {
    backgroundColor: "#e8eef0",
    borderColor: "#9db0b7",
    borderRadius: 4,
  },
  text: {
    color: "#4d6068",
    fontSize: 12,
    fontWeight: "800",
  },
} as const;

const feverModeMood = {
  label: "Fever mode",
  emoji: "🤒",
  bubble: {
    backgroundColor: "#ffb15c",
    borderColor: "#d45c2c",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
  },
  text: {
    color: "#4e180c",
    fontSize: 13,
    fontWeight: "900",
  },
} as const;

const queasyMood = {
  label: "Queasy",
  emoji: "🤢",
  bubble: {
    backgroundColor: "#9bbb72",
    borderColor: "#6f884f",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 10,
  },
  text: {
    color: "#203516",
    fontFamily: "serif",
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "900",
  },
} as const;

const quietModeMood = {
  label: "Quiet mode",
  emoji: "🤫",
  bubble: {
    backgroundColor: "#2d3140",
    borderColor: "#797f99",
    borderRadius: 20,
  },
  text: {
    color: "#d9def2",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
} as const;

export const userMoodOptions = [
  letsGoMood,
  ouchMood,
  yawnMood,
  sleepModeMood,
  bathroomBreakMood,
  whatAWorldMood,
  letsPartyMood,
  notSureMood,
  grrrMood,
  sniffleModeMood,
  feverModeMood,
  queasyMood,
  quietModeMood,
] as const satisfies readonly UserMoodOption[];

export type UserMoodLabel = (typeof userMoodOptions)[number]["label"];

export type UserMoodOption = {
  readonly label: string;
  readonly emoji: string;
  readonly bubble: UserMoodBubbleStyle;
  readonly text: TextStyle;
};

export type UserMoodBubbleStyle = ViewStyle & {
  readonly backgroundColor: string;
};

export function getUserMoodEmoji(moodLabel: UserMoodLabel | null): string | null {
  if (moodLabel === null) return null;

  return userMoodOptions.find((option) => option.label === moodLabel)?.emoji ?? null;
}
