import type { ExpoConfig } from "expo/config";

const localAndroidVersionCode = 41;

function getAndroidVersionCode(): number {
  const releaseNumber = process.env.DAILY_NAGGER_MOBILE_RELEASE_NUMBER;
  if (releaseNumber === undefined) return localAndroidVersionCode;

  const parsedReleaseNumber = Number(releaseNumber);
  const versionCode = localAndroidVersionCode + parsedReleaseNumber;
  if (
    !Number.isSafeInteger(parsedReleaseNumber) ||
    parsedReleaseNumber < 1 ||
    versionCode > 2100000000
  ) {
    throw new Error("DAILY_NAGGER_MOBILE_RELEASE_NUMBER must produce a valid Android versionCode.");
  }

  return versionCode;
}

const config: ExpoConfig = {
  name: process.env.DAILY_NAGGER_MOBILE_APP_NAME ?? "DailyNagger",
  slug: "dailynagger-mobile",
  scheme: "dailynagger",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
  },
  android: {
    package: process.env.DAILY_NAGGER_MOBILE_ANDROID_PACKAGE ?? "com.dailynagger.mobile",
    versionCode: getAndroidVersionCode(),
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-localization",
    "@sentry/react-native",
    "./plugins/withWindowsNinja",
    "./plugins/withAndroidReleaseSigning",
  ],
};

export default config;
