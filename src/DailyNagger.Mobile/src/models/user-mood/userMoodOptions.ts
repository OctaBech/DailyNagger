export const userMoodOptions = [
  { label: "Let's go", emoji: "😀" },
  { label: "Ouch", emoji: "🤕" },
  { label: "Yawn", emoji: "🥱" },
  { label: "Sleep mode", emoji: "😴" },
  { label: "Bathroom break", emoji: "💩" },
  { label: "What a world", emoji: "😭" },
  { label: "Let's party", emoji: "🥳" },
  { label: "Not sure", emoji: "😨" },
  { label: "Grrr", emoji: "😡" },
  { label: "Sniffle mode", emoji: "🤧" },
  { label: "Fever mode", emoji: "🤒" },
  { label: "Queasy", emoji: "🤢" },
  { label: "Quiet mode", emoji: "🤫" },
] as const;

export type UserMoodLabel = (typeof userMoodOptions)[number]["label"];

export type UserMoodOption = (typeof userMoodOptions)[number];
