import { environment } from "@/config";
import { apiJsonRequest } from "./apiRequest";
import type { TagDto } from "@api-contracts";

export async function fetchTags(tagType: string): Promise<readonly TagDto[]> {
  const query = new URLSearchParams({
    communityId: environment.communityId,
    userId: environment.userId,
    tagType,
  });

  return await apiJsonRequest<readonly TagDto[]>({ method: "GET", path: `/api/tags?${query}` });
}
