# Local builds and machine setup

These scripts run on the developer's Windows machine. They are not part of the
GitHub Actions pipeline. No local SQL Server is required for the scripts here.

## Machine requirements

- Install Git, Node.js/npm, .NET, Java, and the Android SDK before building an APK.
- Run `./local-build/local-configure-dev-machine.ps1` from the repository root to
  configure the expected `E:` paths and caches. This changes user-level machine
  settings; it does not install the main toolchains.
- Run `./local-build/local-validate-dev-machine.ps1 -SkipProjectChecks` to check
  the tools and paths, or omit the flag to also restore dependencies and check
  the mobile project.

## Local APKs

`build-mobile-release-apk.ps1` requires an Android project, installed mobile
dependencies, and a mobile `.env` file with the API URL, token, community ID,
and user ID. Pass `-EnvPath` or set `DAILY_NAGGER_MOBILE_ENV_PATH` to choose the
environment explicitly. The script checks these values before building.

`staging-use-secrets.ps1` loads the demo/staging settings from the local secrets
folder into the current PowerShell session. `staging-copy-production-db.ps1`
changes the demo database on the VPS; it is not needed for every APK build.

The former all-in-one local-stack guide is preserved at
`../pipeline/legacy/docs/development-environment.md` for historical reference.
