import { appVariant } from "./appVariant";

const dailyAccent = {
  accent: "#d97828",
  accentBorder: "#b85f1f",
  accentSoft: "#e7b07c",
  accentText: "#fffaf3",
} as const;

const demoAccent = {
  accent: "#f2d66f",
  accentBorder: "#c9a83d",
  accentSoft: "#f7e59b",
  accentText: "#1a1b1d",
} as const;

export const appTheme = appVariant === "demo" ? demoAccent : dailyAccent;
