# Schedule Holidays

This folder owns the holiday schedule contract for the mobile client.

UI code and schedule calculation can ask this folder for holiday choices and
holiday dates. They should not import a third-party holiday library directly.

The provider wrapper gives DailyNagger one repair point when a holiday source
changes keys, names, countries, or date behavior.

## Rules

- Use `getHolidayDefinitions` when the UI needs holiday options.
- Use `getHolidayDefinition` when schedule calculation needs a date.
- Keep provider-specific mapping inside this folder.
- Do not store display labels as the meaning of a schedule rule.
- Keep a version guard test for the active provider.

The version guard exists so provider upgrades cannot silently change schedule
behavior. When the active provider changes version, review the wrapper mappings
and update the expected version deliberately.
