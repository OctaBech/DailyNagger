import { environment } from "@/config";
import type { Guid } from "@/shared";
import { apiRequest } from "./apiRequest";

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

  return apiRequest<readonly TaskStepNameSuggestionDto[]>({
    method: "GET",
    path: `/api/naggers/${naggerId}/task-step-name-suggestions?${query}`,
  });
}
