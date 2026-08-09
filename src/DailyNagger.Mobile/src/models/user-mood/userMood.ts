import type { Guid } from "@/shared";
import type { UserMoodLabel } from "./userMoodOptions";

export type UserMood = {
  readonly contentType: "UserMood";
  readonly id: Guid;
  readonly mood: UserMoodLabel;
  readonly recordedAt: string;
  readonly timeZone: string;
  readonly locale: string;
};

export function isUserMood(content: unknown): content is UserMood {
  if (typeof content !== "object" || content === null) return false;
  if (!("contentType" in content)) return false;

  return content.contentType === "UserMood";
}
