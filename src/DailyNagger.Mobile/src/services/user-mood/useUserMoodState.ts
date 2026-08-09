import { userMoodOptions, type UserMood, type UserMoodLabel } from "@/models";
import { newGuid, type Prettify } from "@/shared";
import { useState } from "react";

export function useUserMoodState() {
  const [selectedMood, setSelectedMood] = useState<UserMoodLabel | null>(null);
  const [selectedAt, setSelectedAt] = useState<string | null>(null);
  const [selectedAtIso, setSelectedAtIso] = useState<string | null>(null);

  function create(input: CreateUserMoodInput): UserMood {
    return {
      contentType: "UserMood",
      id: newGuid(),
      mood: input.mood,
      recordedAt: new Date().toISOString(),
      timeZone: input.timeZone,
      locale: input.locale,
    };
  }

  function select(userMood: UserMood): void {
    setSelectedMood(userMood.mood);
    setSelectedAt(formatTime(new Date(userMood.recordedAt)));
    setSelectedAtIso(userMood.recordedAt);
  }

  return {
    options: userMoodOptions,
    state: {
      selectedMood,
      selectedAt,
      selectedAtIso,
    },
    create,
    select,
  };
}

type CreateUserMoodInput = {
  readonly mood: UserMoodLabel;
  readonly timeZone: string;
  readonly locale: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type UserMoodState = Prettify<ReturnType<typeof useUserMoodState>>;
