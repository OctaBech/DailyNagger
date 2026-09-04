# ADR 0013: Staging Via Community Database Routing

## Status

Accepted

## Context

DailyNagger needs a safer way to test risky mobile changes before they touch
real production data.

This is especially important for changes around task tree traversal, rollover,
DTO conversion, optimistic writes, and queued sending. Those changes can look
fine in TypeScript but still write the wrong shape of data if the client logic
is wrong.

The server is intentionally kept relatively dumb. It owns persistence, API
contracts, version checks, and server-side tree structure. It does not own the
daily user workflow. Most product behavior lives in the mobile client.

That means the main staging risk is usually not "does a different server
configuration work?". The main risk is "can this mobile build read and write a
realistic task tree without damaging Martin's real data?".

DailyNagger already has a control database that maps a `communityId` to a data
database connection string.

```txt
Mobile app
  sends communityId
        |
        v
DailyNagger Server
  reads community settings from DailyNaggerControl
        |
        v
DailyNaggerControl
  production community -> DailyNaggerData
  staging community    -> DailyNaggerData_Staging
        |
        v
Selected data database
```

## Decision

DailyNagger will use the existing community-based database routing as the first
staging model.

A staging mobile APK should use:

- the same server/API code as production
- a staging `communityId`
- a staging API token
- a separate Android package id, so it can be installed next to the production
  app

The staging `communityId` should point to a separate data database, for example
`DailyNaggerData_Staging`.

Staging data may be created by restoring or copying production data into the
staging database. The copy is allowed to be destroyed, rewritten, and tested
against. Production data is not.

We choose this over a separate staging server because it matches the current
shape of the system. The server is deliberately simple, and the existing
multi-community routing is exactly the part we want to trust for this use case.

## Consequences

Production and staging can run through the same deployed server while still
writing to different data databases.

This keeps staging cheap and understandable for a personal project. It also
tests the routing model the server already depends on instead of adding a
second server environment before there is a real need.

A separate staging server is not forbidden. It can be introduced later if
server configuration, migrations, external integrations, or infrastructure
changes become risky enough to require more isolation than data separation.

The staging APK must be visibly separate from production. It should not reuse
the production Android package id, and it should not use production secrets.
