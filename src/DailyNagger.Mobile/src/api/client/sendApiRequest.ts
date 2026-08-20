import type { JsonValue } from "@/shared";
import type { ClientIdentity } from "@/models/clientIdentity";
import { environment } from "@/config";
import type { ClientIdentityDto, VersionedResponseDto } from "@/api/dto";
import { apiRequest, ApiRequestError } from "./apiRequest";

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

  const body = {
    communityId: environment.communityId,
    userId: environment.userId,
    updatedAt: processing.queuedAt,
    baseVersion: processing.baseVersion,
    nextVersion: processing.nextVersion,
    skipPayloadVersionValidation: processing.skipPayloadVersionValidation,
    clientIdentity: toClientIdentityDto(processing.clientIdentity),
    payload,
  };

  try {
    const result = await apiRequest<VersionedResponseDto>({ method, path: endpoint, body });

    if (result.kind !== "ok") {
      throw new Error("Send API request response had no JSON body.");
    }

    return result.body;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw new SendApiRequestError(error.response.status, error.responseBody);
    }

    throw error;
  }
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
