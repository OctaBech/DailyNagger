const configuredVariant = process.env.EXPO_PUBLIC_DAILY_NAGGER_APP_VARIANT ?? "daily";

if (configuredVariant !== "daily" && configuredVariant !== "demo") {
  throw new Error(`Unknown DailyNagger app variant: ${configuredVariant}`);
}

export const appVariant = configuredVariant;
