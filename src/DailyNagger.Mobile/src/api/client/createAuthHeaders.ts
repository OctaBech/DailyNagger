import { environment } from "@/config";

export function createAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${environment.apiToken}`,
  };
}
