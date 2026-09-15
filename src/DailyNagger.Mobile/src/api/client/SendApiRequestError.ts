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
