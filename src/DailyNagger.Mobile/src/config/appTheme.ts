const appEnvironment = process.env.EXPO_PUBLIC_DAILY_NAGGER_APP_ENV ?? "production";

const productionAccent = {
  accent: "#d97828",
  accentBorder: "#b85f1f",
  accentSoft: "#e7b07c",
  accentText: "#fffaf3",
} as const;

const stagingAccent = {
  accent: "#f2d66f",
  accentBorder: "#c9a83d",
  accentSoft: "#f7e59b",
  accentText: "#1a1b1d",
} as const;

export const appTheme = appEnvironment === "staging" ? stagingAccent : productionAccent;
