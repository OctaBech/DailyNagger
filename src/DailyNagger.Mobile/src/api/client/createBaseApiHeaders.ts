import { environment } from "@/config";
import { newGuid } from "@/shared";

export function createBaseApiHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${environment.apiToken}`,
    "X-DailyNagger-Request-Id": newGuid(),
  };
}
