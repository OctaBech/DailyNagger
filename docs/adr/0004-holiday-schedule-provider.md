# ADR 0004: Holiday Schedule Provider

## Status

Accepted

## Context

DailyNagger needs schedule rules for holidays.

The user should be able to say that something is due on a holiday without
manually tracking the date each year. That includes fixed dates such as
Christmas and moving dates such as Mother's Day.

Writing every holiday calculation ourselves would be a lot of code, and it
would be easy to forget important days. It would also hide the fact that the app
can work with real third-party tools.

At the same time, saved schedule rules are user data. They should not depend
directly on whatever shape a library happens to expose today. If a provider
changes names, keys, or behavior, the app should have one repair point instead
of leaking that change through the whole model.

## Decision

DailyNagger will use a holiday provider wrapper.

The app may use `date-holidays` behind that wrapper, but UI code, schedule
calculation, and stored schedule rules should talk to DailyNagger's holiday
provider contract, not directly to the library.

The wrapper owns:

- listing holidays for a supported country
- calculating the date for a holiday in a year
- mapping DailyNagger holiday keys to provider data
- adding missing holidays when the provider does not include what the app needs
- repairing provider key changes when the library is upgraded

The installed provider version is part of the contract. A test should fail if
the `date-holidays` package version changes without an explicit update to the
wrapper contract.

DailyNagger will keep a provider version guard test. The test should compare the
installed `date-holidays` package version with the version declared by the
holiday wrapper. If they differ, the test must fail until the wrapper has been
reviewed and the expected version has been updated deliberately.

Saved rules may keep provider information for traceability, but the rest of the
app should still go through the wrapper.

## Consequences

Holiday support can use a real third-party source without turning that source
into the app's data model.

Upgrading `date-holidays` is a deliberate migration task. The version guard test
should force us to check whether keys, labels, or date calculations changed.

The version guard test is not optional documentation. It is the mechanism that
keeps package upgrades from silently changing holiday schedule behavior.

If a holiday is missing or wrong, the fix belongs in the holiday wrapper. It
should not be patched separately in the schedule modal, schedule calculator, and
stored data.

The holiday picker can show labels from the provider, but labels are display
text. They are not the stable meaning of a saved rule.
