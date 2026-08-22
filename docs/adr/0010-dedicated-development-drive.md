# 0010 Dedicated Development Drive

## Status

Accepted.

## Context

DailyNagger has outgrown an ad hoc development setup. The OS drive must stay clean, and the project needs enough room for source code, generated artifacts, Docker data, local databases, logs, caches, and tooling.

We also need the environment to be easy to rebuild. A future developer should be able to clone the repo, run documented setup scripts, and understand where local-only state belongs.

## Decision

DailyNagger development uses a dedicated `E:` development drive.

The drive root owns local development state that must not be mixed into the repository:

```text
E:\Development\
E:\Development\DailyNagger\
E:\Development\Programs\
E:\Development\Secrets\
E:\Development\Caches\
E:\Development\Docker\
E:\Development\Data\
```

`E:\Development\DailyNagger\` is the repository workspace.

`E:\Development\Programs\` is for development tools that allow a custom install location.

`E:\Development\Secrets\` is for local secret files. It is not a repository folder and must never be committed.

`E:\Development\Caches\` is for heavy generated caches where tools support relocation, for example npm, NuGet, and Gradle.

`E:\Development\Docker\` and `E:\Development\Data\` are for local service state such as SQL Server and Seq containers.

## Rules

- `C:` is treated as the OS drive, not the development workspace.
- Secrets live outside the repo. The repo contains examples, not real values.
- Generated artifacts and caches must be either reproducible or explicitly documented.
- Docker-based local services are preferred for SQL Server and Seq.
- Setup scripts should make the environment boring to recreate.
- Cleanup scripts may remove generated state, but only when the paths are explicit and inside the development drive.

## Consequences

The repo can describe the expected machine layout without storing machine-specific secrets or generated output.

The development setup becomes more professional: the project has a clear boundary between source code, local tools, local secrets, caches, and service data.

Some tools will still place small files on `C:` because Windows, installers, registry entries, and user profiles work that way. The goal is not a perfect `C:` with zero changes. The goal is that heavy and project-owned development state lives on `E:`.
