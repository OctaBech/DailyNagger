import { environment } from "@/config";
import { apiRequestHeaders } from "./apiRequestHeaders";

export function createBaseApiHeaders(requestId: string): Record<string, string> {
  return {
    [apiRequestHeaders.authorization]: `Bearer ${environment.apiToken}`,
    [apiRequestHeaders.requestId]: requestId,
  };
}
