import { environment } from "@/config";
import type { Guid } from "@/shared";
import { createAuthHeaders } from "./createAuthHeaders";

export class FetchTaskStepNameSuggestionsError extends Error {
  constructor(readonly status: number) {
    super(`Failed to fetch task step name suggestions. Status: ${status}`);
  }
}

export type TaskStepNameSuggestionDto = {
  readonly name: string;
};

export async function fetchTaskStepNameSuggestions(
  naggerId: Guid,
): Promise<readonly TaskStepNameSuggestionDto[]> {
  const query = new URLSearchParams({
    communityId: environment.communityId,
    userId: environment.userId,
  });

  const response = await fetch(
    `${environment.apiBaseUrl}/api/naggers/${naggerId}/task-step-name-suggestions?${query}`,
    {
      headers: createAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new FetchTaskStepNameSuggestionsError(response.status);
  }

  return await response.json();
}
