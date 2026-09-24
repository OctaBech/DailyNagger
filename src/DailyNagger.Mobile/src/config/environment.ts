import { z } from "zod";

const environmentSchema = z.object({
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(1),
  communityId: z.string().guid(),
  sentryDsn: z.string().url().optional(),
  userId: z.string().guid(),
});

function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const environment = environmentSchema.parse({
  apiBaseUrl: requireEnv(
    "EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL",
    process.env.EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL,
  ),
  apiToken: requireEnv(
    "EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN",
    process.env.EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN,
  ),
  communityId: requireEnv(
    "EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID",
    process.env.EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID,
  ),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
  userId: requireEnv(
    "EXPO_PUBLIC_DAILY_NAGGER_USER_ID",
    process.env.EXPO_PUBLIC_DAILY_NAGGER_USER_ID,
  ),
});
