import type { Prettify } from "@/shared";

export const emptyInteractionStamp = {
  interactionAt: null,
  interactionTimeZone: null,
  interactionLocale: null,
  interactionMood: null,
  interactionMoodAt: null,
} as const;

export type InteractionStampFields = Prettify<{
  readonly [Key in keyof typeof emptyInteractionStamp]: string | null;
}>;
