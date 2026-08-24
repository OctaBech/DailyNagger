import { environment } from "@/config";
import type { Guid } from "@/shared";
import { apiJsonRequest } from "./apiRequest";
import type { TaskStepNameSuggestionDto } from "@api-contracts";

export async function fetchTaskStepNameSuggestions(
  naggerId: Guid,
): Promise<readonly TaskStepNameSuggestionDto[]> {
  const query = new URLSearchParams({
    communityId: environment.communityId,
    userId: environment.userId,
  });

  return apiJsonRequest<readonly TaskStepNameSuggestionDto[]>({
    method: "GET",
    path: `/api/naggers/${naggerId}/task-step-name-suggestions?${query}`,
  });
}
