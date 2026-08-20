import { environment } from "@/config";
import { apiRequest } from "./apiRequest";

export type TagDto = {
  readonly name: string;
  readonly description: string | null;
  readonly lastUsedAt: string | null;
};

export async function fetchTags(tagType: string): Promise<readonly TagDto[]> {
  const query = new URLSearchParams({
    communityId: environment.communityId,
    userId: environment.userId,
    tagType,
  });

  return await apiRequest<readonly TagDto[]>({ method: "GET", path: `/api/tags?${query}` });
}
