import { z } from "zod";

const environmentSchema = z.object({
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(1),
  communityId: z.string().guid(),
  sentryDsn: z.string().url().optional(),
  userId: z.string().guid(),
});

export const environment = environmentSchema.parse({
  apiBaseUrl: process.env.EXPO_PUBLIC_DAILY_NAGGER_API_BASE_URL ?? "http://localhost:5010",
  apiToken: process.env.EXPO_PUBLIC_DAILY_NAGGER_API_TOKEN ?? "",
  communityId:
    process.env.EXPO_PUBLIC_DAILY_NAGGER_COMMUNITY_ID ?? "22222222-2222-2222-2222-222222222222",
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
  userId: process.env.EXPO_PUBLIC_DAILY_NAGGER_USER_ID ?? "11111111-1111-1111-1111-111111111111",
});
