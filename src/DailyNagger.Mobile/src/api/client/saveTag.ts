import { getActiveUserId } from "@/config/activeUserId";
import { environment } from "@/config";
import type { TagDto } from "@api-contracts";
import { apiJsonRequest } from "./apiRequest";

export async function saveTag(
  tagType: string,
  name: string,
  description: string | null,
): Promise<TagDto> {
  const body = {
    communityId: environment.communityId,
    userId: getActiveUserId(),
    tagType,
    name,
    description,
  };

  return await apiJsonRequest<TagDto>({ method: "PUT", path: "/api/tags", body });
}
