const { withAppBuildGradle } = require("@expo/config-plugins");

const marker = "// DailyNagger: sign release APK with the configured keystore";

function addReleaseSigning(contents) {
  if (contents.includes(marker)) return contents;

  const signingConfigsStart = "    signingConfigs {";
  const releaseBuildType =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)(signingConfig signingConfigs\.debug)/;
  if (!contents.includes(signingConfigsStart) || !releaseBuildType.test(contents)) {
    throw new Error("Could not find Expo's Android release signing configuration.");
  }

  const releaseSigningConfig = `
        ${marker}
        release {
            def keystorePath = System.getenv("DAILY_NAGGER_ANDROID_KEYSTORE_PATH")
            def signingPassword = System.getenv("DAILY_NAGGER_ANDROID_SIGNING_PASSWORD")
            def signingKeyAlias = System.getenv("DAILY_NAGGER_ANDROID_KEY_ALIAS")
            if (!keystorePath || !signingPassword || !signingKeyAlias) {
                throw new GradleException("Android release signing credentials are missing.")
            }
            storeFile file(keystorePath)
            storePassword signingPassword
            keyAlias signingKeyAlias
            keyPassword signingPassword
        }
`;

  return contents
    .replace(signingConfigsStart, `${signingConfigsStart}${releaseSigningConfig}`)
    .replace(releaseBuildType, "$1signingConfig signingConfigs.release");
}

module.exports = function withAndroidReleaseSigning(config) {
  const mode = process.env.DAILY_NAGGER_ANDROID_RELEASE_SIGNING;
  if (mode === undefined) return config;
  if (mode !== "required") {
    throw new Error("DAILY_NAGGER_ANDROID_RELEASE_SIGNING must be 'required'.");
  }

  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = addReleaseSigning(config.modResults.contents);
    return config;
  });
};

module.exports.addReleaseSigning = addReleaseSigning;
