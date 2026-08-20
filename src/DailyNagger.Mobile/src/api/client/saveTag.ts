import { environment } from "@/config";
import type { TagDto } from "./fetchTags";
import { apiRequest } from "./apiRequest";

export async function saveTag(
  tagType: string,
  name: string,
  description: string | null,
): Promise<TagDto> {
  const body = {
    communityId: environment.communityId,
    userId: environment.userId,
    tagType,
    name,
    description,
  };

  return await apiRequest<TagDto>({ method: "PUT", path: "/api/tags", body });
}
