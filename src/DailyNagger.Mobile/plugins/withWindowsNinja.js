const { withAppBuildGradle } = require("@expo/config-plugins");

const marker = "// DailyNagger: use pinned Ninja on Windows for CMake long path support";

const gradleBlock = `
        ${marker}
        def dailyNaggerNinja = file(System.getenv("DAILY_NAGGER_NINJA") ?: "E:/Programs/ninja/ninja.exe")
        if (System.getProperty("os.name").toLowerCase().contains("windows") && dailyNaggerNinja.exists()) {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_MAKE_PROGRAM=\${dailyNaggerNinja.absolutePath.replace("\\\\", "/")}"
                }
            }
        }
`;

function addWindowsNinjaOverride(contents) {
  if (contents.includes(marker)) {
    return contents;
  }

  if (!contents.includes("defaultConfig {")) {
    throw new Error("Could not find defaultConfig block in android/app/build.gradle.");
  }

  return contents.replace("defaultConfig {", `defaultConfig {${gradleBlock}`);
}

module.exports = function withWindowsNinja(config) {
  return withAppBuildGradle(config, (config) => {
    config.modResults.contents = addWindowsNinjaOverride(config.modResults.contents);
    return config;
  });
};
