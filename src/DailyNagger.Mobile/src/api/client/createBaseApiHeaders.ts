import { environment } from "@/config";
import { newGuid } from "@/shared";
import { apiRequestHeaders } from "./apiRequestHeaders";

export function createBaseApiHeaders(): Record<string, string> {
  return {
    [apiRequestHeaders.authorization]: `Bearer ${environment.apiToken}`,
    [apiRequestHeaders.requestId]: newGuid(),
  };
}
