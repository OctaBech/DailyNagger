import { environment } from "@/config";
import { createAuthHeaders } from "./createAuthHeaders";

type ApiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiRequestError extends Error {
  constructor(
    readonly url: string,
    readonly request: RequestInit,
    readonly response: Response,
    readonly responseBody: string,
  ) {
    super(
      `API request failed. ${request.method ?? "GET"} ${url}. Status: ${response.status}. Body: ${responseBody}`,
    );
  }
}

type ApiRequestOptions = {
  readonly body?: unknown;
  readonly method: ApiRequestMethod;
  readonly path: string;
};

export async function apiRequest<TResponse>(options: ApiRequestOptions): Promise<TResponse> {
  const url = createApiUrl(options.path);
  const request = createApiRequest(options);

  const response = await fetch(url, request);

  if (!response.ok) {
    const responseBody = await response.text();
    throw new ApiRequestError(url, request, response, responseBody);
  }

  return await response.json();
}

function createApiRequest(options: ApiRequestOptions): RequestInit {
  return {
    method: options.method,
    headers: createApiHeaders(options.body),
    body: createJsonBody(options.body),
  };
}

function createApiUrl(path: string): string {
  const baseUrl = environment.apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");

  return `${baseUrl}/${normalizedPath}`;
}

function createApiHeaders(body: unknown): Record<string, string> {
  if (body === undefined) {
    return createAuthHeaders();
  }

  return {
    ...createAuthHeaders(),
    "Content-Type": "application/json",
  };
}

function createJsonBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }

  return JSON.stringify(body);
}
