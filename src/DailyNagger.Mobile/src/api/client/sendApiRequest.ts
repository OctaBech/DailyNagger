import type { JsonValue } from "@/shared";
import type { ClientIdentity } from "@/models/clientIdentity";
import { environment } from "@/config";
import type { ClientIdentityDto, VersionedResponseDto } from "@/api/dto";
import { createAuthHeaders } from "./createAuthHeaders";

export class SendApiRequestError extends Error {
  readonly currentVersion: number | null;

  constructor(
    readonly status: number,
    readonly responseBody: string,
  ) {
    super(`Failed to send update. Status: ${status}. Response: ${responseBody}`);
    this.currentVersion = getCurrentVersion(responseBody);
  }
}

export type SendApiRequest = {
  readonly method: "PATCH" | "PUT" | "POST";
  readonly endpoint: string;
  readonly payload: JsonValue;
  readonly processing: {
    readonly queuedAt: string;
    readonly baseVersion?: number;
    readonly nextVersion?: number;
    readonly clientIdentity: ClientIdentity;
    readonly skipPayloadVersionValidation?: boolean;
  };
};

export async function sendApiRequest(request: SendApiRequest): Promise<VersionedResponseDto> {
  const { method, endpoint, payload, processing } = request;

  const response = await fetch(createApiUrl(endpoint), {
    method,
    headers: {
      ...createAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      communityId: environment.communityId,
      userId: environment.userId,
      updatedAt: processing.queuedAt,
      baseVersion: processing.baseVersion,
      nextVersion: processing.nextVersion,
      skipPayloadVersionValidation: processing.skipPayloadVersionValidation,
      clientIdentity: toClientIdentityDto(processing.clientIdentity),
      payload,
    }),
  });
  if (!response.ok) {
    throw new SendApiRequestError(response.status, await response.text());
  }

  return await response.json();
}

function createApiUrl(endpoint: string): string {
  const baseUrl = environment.apiBaseUrl.replace(/\/+$/, "");
  const path = endpoint.replace(/^\/+/, "");

  return `${baseUrl}/${path}`;
}

function toClientIdentityDto(clientIdentity: ClientIdentity): ClientIdentityDto {
  return {
    clientId: clientIdentity.clientId,
    deviceName: clientIdentity.deviceName,
    deviceModel: clientIdentity.deviceModel,
  };
}

function getCurrentVersion(responseBody: string): number | null {
  try {
    const parsed = JSON.parse(responseBody);

    if (!isObject(parsed)) return null;
    if (typeof parsed.currentVersion !== "number") return null;

    return parsed.currentVersion;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
