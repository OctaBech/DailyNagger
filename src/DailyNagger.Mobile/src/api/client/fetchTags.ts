import { environment } from "@/config";
import { createAuthHeaders } from "./createAuthHeaders";

export class FetchTagsError extends Error {
  constructor(readonly status: number) {
    super(`Failed to fetch tags. Status: ${status}`);
  }
}

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

  const response = await fetch(`${environment.apiBaseUrl}/api/tags?${query}`, {
    headers: createAuthHeaders(),
  });

  if (!response.ok) {
    throw new FetchTagsError(response.status);
  }

  return await response.json();
}
