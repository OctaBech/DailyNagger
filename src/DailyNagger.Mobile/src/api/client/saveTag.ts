import { environment } from "@/config";
import type { TagDto } from "./fetchTags";
import { createAuthHeaders } from "./createAuthHeaders";

export class SaveTagError extends Error {
  constructor(readonly status: number) {
    super(`Failed to save tag. Status: ${status}`);
  }
}

export async function saveTag(
  tagType: string,
  name: string,
  description: string | null,
): Promise<TagDto> {
  const response = await fetch(`${environment.apiBaseUrl}/api/tags`, {
    method: "PUT",
    headers: {
      ...createAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      communityId: environment.communityId,
      userId: environment.userId,
      tagType,
      name,
      description,
    }),
  });

  if (!response.ok) {
    throw new SaveTagError(response.status);
  }

  return await response.json();
}
