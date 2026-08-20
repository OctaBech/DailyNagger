import { environment } from "@/config";
import { createBaseApiHeaders } from "./createBaseApiHeaders";

type ApiRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiRequestError extends Error {
  readonly requestId: string | null;

  constructor(
    readonly url: string,
    readonly request: RequestInit,
    readonly response: Response,
    readonly responseBody: string,
  ) {
    const requestId = getRequestId(request);

    super(
      `API request failed. ${request.method ?? "GET"} ${url}. Status: ${response.status}. RequestId: ${requestId ?? "none"}. Body: ${responseBody}`,
    );

    this.requestId = requestId;
  }
}

export class ApiConnectionError extends Error {
  readonly requestId: string | null;

  constructor(
    readonly url: string,
    readonly request: RequestInit,
    readonly cause: unknown,
  ) {
    const requestId = getRequestId(request);

    super(
      `API request could not connect. ${request.method ?? "GET"} ${url}. RequestId: ${requestId ?? "none"}.`,
    );

    this.requestId = requestId;
  }
}

type ApiRequestOptions = {
  readonly body?: unknown;
  readonly method: ApiRequestMethod;
  readonly path: string;
};

export type ApiRequestResult<TResponse> =
  | { readonly kind: "ok"; readonly status: number; readonly body: TResponse }
  | { readonly kind: "accepted"; readonly status: 202; readonly body: null }
  | { readonly kind: "no-content"; readonly status: 204; readonly body: null };

export async function apiJsonRequest<TResponse>(options: ApiRequestOptions): Promise<TResponse> {
  const result = await apiRequest<TResponse>(options);

  if (result.kind !== "ok") {
    throw new Error(`API request returned no JSON body. ${options.method} ${options.path}`);
  }

  return result.body;
}

export async function apiRequest<TResponse>(
  options: ApiRequestOptions,
): Promise<ApiRequestResult<TResponse>> {
  const url = createApiUrl(options.path);
  const request = createApiRequest(options);

  const response = await sendApiFetch(url, request);

  if (!response.ok) {
    const responseBody = await response.text();
    throw new ApiRequestError(url, request, response, responseBody);
  }

  if (response.status === 202) {
    return { kind: "accepted", status: 202, body: null };
  }

  if (response.status === 204) {
    return { kind: "no-content", status: 204, body: null };
  }

  return { kind: "ok", status: response.status, body: await response.json() };
}

async function sendApiFetch(url: string, request: RequestInit): Promise<Response> {
  try {
    return await fetch(url, request);
  } catch (error) {
    throw new ApiConnectionError(url, request, error);
  }
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
    return createBaseApiHeaders();
  }

  return {
    ...createBaseApiHeaders(),
    "Content-Type": "application/json",
  };
}

function createJsonBody(body: unknown): string | undefined {
  if (body === undefined) {
    return undefined;
  }

  return JSON.stringify(body);
}

function getRequestId(request: RequestInit): string | null {
  const headers = request.headers;
  if (headers === undefined || headers instanceof Headers || Array.isArray(headers)) {
    return null;
  }

  return headers["X-DailyNagger-Request-Id"] ?? null;
}
