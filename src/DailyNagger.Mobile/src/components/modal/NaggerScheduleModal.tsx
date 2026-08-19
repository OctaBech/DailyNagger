import { useMemo, useState } from "react";
import {
  SCHEDULE_EVERY,
  SCHEDULE_LAST_DAY,
  SCHEDULE_LAST_POSITION,
  getHolidayDefinition,
  getHolidayDefinitions,
  getScheduleRuleKey,
  holidayCountries,
  type HolidayCountryCode,
  type Nagger,
  type ScheduleRule,
  type ScheduleWeekday,
} from "@/models";
import { newGuid } from "@/shared";
import { SheetModal } from "./SheetModal";
import { SheetButton } from "./SheetButton";
import { SheetChip } from "./SheetChip";
import { SheetChipRow } from "./SheetChipRow";
import { SheetFooterActions, SheetFooterSpacer } from "./SheetFooterActions";
import { SheetHeadingBelt } from "./SheetHeadingBelt";
import { type SheetNarrowBeltOption } from "./SheetNarrowBelt";
import { SheetNarrowPicker } from "./SheetNarrowPicker";
import { SheetSection } from "./SheetSection";
import { SheetText } from "./SheetText";
import { SheetWheel } from "./SheetWheel";

type ScheduleBuilderType = ScheduleRule["ruleType"];

const scheduleBuilderOptions = [
  { label: "Weekday", value: "Weekday" },
  { label: "Date", value: "Date" },
  { label: "Holiday", value: "Holiday" },
] as const satisfies readonly { label: string; value: ScheduleBuilderType }[];

const weekdayRules = [
  { label: "All", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
] as const;

const weekdayWheelOptions = weekdayRules.map((rule) => ({
  label: rule.label,
  value: rule.value,
}));

const monthRules = [
  { label: "All", value: SCHEDULE_EVERY },
  { label: "Jan", value: 1 },
  { label: "Feb", value: 2 },
  { label: "Mar", value: 3 },
  { label: "Apr", value: 4 },
  { label: "May", value: 5 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 7 },
  { label: "Aug", value: 8 },
  { label: "Sep", value: 9 },
  { label: "Oct", value: 10 },
  { label: "Nov", value: 11 },
  { label: "Dec", value: 12 },
] as const;

const monthWheelOptions = monthRules.map((rule) => ({
  label: rule.label,
  value: rule.value,
}));

const positionRules = [
  { label: "All", value: SCHEDULE_EVERY },
  { label: "1st", value: 1 },
  { label: "2nd", value: 2 },
  { label: "3rd", value: 3 },
  { label: "4th", value: 4 },
  { label: "Last", value: SCHEDULE_LAST_POSITION },
] as const;

const positionWheelOptions = positionRules.map((rule) => ({
  label: rule.label,
  value: rule.value,
}));

const currentYear = new Date().getFullYear();

const yearRules = [
  { label: "All", value: SCHEDULE_EVERY },
  ...Array.from({ length: 10 }, (_, index) => {
    const year = currentYear + index;

    return { label: String(year), value: year };
  }),
] as const;

const yearWheelOptions = yearRules.map((rule) => ({
  label: rule.label,
  value: rule.value,
}));

const dayOfMonthRules = [
  { label: "All", value: SCHEDULE_EVERY },
  ...Array.from({ length: 31 }, (_, index) => {
    const dayOfMonth = index + 1;

    return { label: String(dayOfMonth), value: dayOfMonth };
  }),
  { label: "Last", value: SCHEDULE_LAST_DAY },
] as const;

const dayOfMonthWheelOptions = dayOfMonthRules.map((rule) => ({
  label: rule.label,
  value: rule.value,
}));

const defaultHolidayCountryCode: HolidayCountryCode = "DK";
const defaultHolidayId = getHolidayDefinitions(defaultHolidayCountryCode)[0]?.holidayId ?? "";

const holidayCountryWheelOptions = holidayCountries.map((country) => ({
  label: country.label,
  value: country.value,
}));

const holidaySortOptions = [
  { label: "Date", value: "date" },
  { label: "A-Z", value: "alphabetical" },
] as const;

type NaggerScheduleModalProps = {
  readonly visible: boolean;
  readonly nagger: Nagger;
  readonly getPreviewDueOn: (scheduleRules: readonly ScheduleRule[]) => string | null;
  readonly onDismiss: () => void;
  readonly onDone: (scheduleRules: readonly ScheduleRule[]) => void;
};

export const NaggerScheduleModal = (props: NaggerScheduleModalProps) => {
  const { visible } = props;

  if (!visible) return null;

  return <NaggerScheduleModalContent key={props.nagger.id} {...props} />;
};

function NaggerScheduleModalContent(props: NaggerScheduleModalProps) {
  const { visible, nagger, getPreviewDueOn, onDismiss, onDone } = props;

  const [selectedBuilderType, setSelectedBuilderType] = useState<ScheduleBuilderType>("Weekday");
  const [selectedWeekdayMonth, setSelectedWeekdayMonth] = useState(SCHEDULE_EVERY);
  const [selectedWeekdayPosition, setSelectedWeekdayPosition] = useState(SCHEDULE_EVERY);
  const [selectedWeekday, setSelectedWeekday] = useState<ScheduleWeekday>(SCHEDULE_EVERY);
  const [selectedDateYear, setSelectedDateYear] = useState(SCHEDULE_EVERY);
  const [selectedDateMonth, setSelectedDateMonth] = useState(SCHEDULE_EVERY);
  const [selectedDateDayOfMonth, setSelectedDateDayOfMonth] = useState(SCHEDULE_EVERY);
  const [selectedHolidayCountryCode, setSelectedHolidayCountryCode] =
    useState<HolidayCountryCode>(defaultHolidayCountryCode);
  const [selectedHolidayId, setSelectedHolidayId] = useState(defaultHolidayId);
  const [holidaySearchText, setHolidaySearchText] = useState("");

  const [draftRules, setDraftRules] = useState<readonly ScheduleRule[]>(nagger.scheduleRules);
  const [activeRuleKey, setActiveRuleKey] = useState<string | null>(null);
  const previewDueOn = getPreviewDueOn(draftRules);
  const holidayOptions = useMemo<readonly SheetNarrowBeltOption<string>[]>(
    () =>
      getHolidayDefinitions(selectedHolidayCountryCode).map((holiday) => {
        const holidayDate = holiday.getDate(currentYear);

        return {
          date: holidayDate.toISOString().slice(0, 10),
          label: holiday.label,
          value: holiday.holidayId,
        };
      }),
    [selectedHolidayCountryCode],
  );

  function createWeekdayScheduleRule(): ScheduleRule {
    return {
      id: newGuid(),
      ruleType: "Weekday",
      rule: {
        month: selectedWeekdayMonth,
        position: selectedWeekdayPosition,
        weekday: selectedWeekday,
      },
    };
  }

  function createDateScheduleRule(): ScheduleRule {
    return {
      id: newGuid(),
      ruleType: "Date",
      rule: {
        year: selectedDateYear,
        month: selectedDateMonth,
        dayOfMonth: selectedDateDayOfMonth,
      },
    };
  }

  function createHolidayScheduleRule(holidayId: string): ScheduleRule {
    return {
      id: newGuid(),
      ruleType: "Holiday",
      rule: {
        countryCode: selectedHolidayCountryCode,
        holidayId,
      },
    };
  }

  function removeScheduleRule(ruleId: string): void {
    const removedRule = draftRules.find((rule) => rule.id === ruleId) ?? null;
    const removedRuleKey = removedRule === null ? null : getScheduleRuleKey(removedRule);

    setDraftRules(draftRules.filter((rule) => rule.id !== ruleId));
    if (removedRuleKey === activeRuleKey) {
      setActiveRuleKey(null);
    }
  }

  function addSelectedWeekdayRule(): void {
    const selectedRule = createWeekdayScheduleRule();
    const selectedRuleKey = getScheduleRuleKey(selectedRule);
    const selectedRuleIsSimpleWeekday = isSimpleWeekdayRule(selectedRule);

    if (draftRules.some((rule) => getScheduleRuleKey(rule) === selectedRuleKey)) {
      setActiveRuleKey(selectedRuleKey);
      return;
    }

    const draftRulesV1 = selectedRuleIsSimpleWeekday
      ? removeConflictingSimpleWeekdayRules(draftRules, selectedRule)
      : draftRules;

    setDraftRules([...draftRulesV1, selectedRule]);
    setActiveRuleKey(selectedRuleKey);
  }

  function addSelectedDateRule(): void {
    if (!canDateRuleEverMatch(selectedDateYear, selectedDateMonth, selectedDateDayOfMonth)) {
      return;
    }

    const selectedRule = createDateScheduleRule();
    const selectedRuleKey = getScheduleRuleKey(selectedRule);

    if (draftRules.some((rule) => getScheduleRuleKey(rule) === selectedRuleKey)) {
      setActiveRuleKey(selectedRuleKey);
      return;
    }

    setDraftRules([...draftRules, selectedRule]);
    setActiveRuleKey(selectedRuleKey);
  }

  function addSelectedHolidayRule(): void {
    const selectedHolidayIdV1 = resolveHolidayIdFromSearchText(
      holidayOptions,
      holidaySearchText,
      selectedHolidayId,
    );

    if (selectedHolidayIdV1 === "") return;

    const selectedRule = createHolidayScheduleRule(selectedHolidayIdV1);
    const selectedRuleKey = getScheduleRuleKey(selectedRule);

    if (draftRules.some((rule) => getScheduleRuleKey(rule) === selectedRuleKey)) {
      setActiveRuleKey(selectedRuleKey);
      return;
    }

    setDraftRules([...draftRules, selectedRule]);
    setActiveRuleKey(selectedRuleKey);
  }

  function changeSelectedBuilderType(builderType: ScheduleBuilderType): void {
    setSelectedBuilderType(builderType);
    setActiveRuleKey(null);
  }

  function changeSelectedWeekday(weekday: ScheduleWeekday): void {
    setSelectedWeekday(weekday);
    if (weekday === SCHEDULE_EVERY) {
      setSelectedWeekdayMonth(SCHEDULE_EVERY);
      setSelectedWeekdayPosition(SCHEDULE_EVERY);
    }
    setActiveRuleKey(null);
  }

  function changeSelectedDateYear(year: number): void {
    setSelectedDateYear(year);
    setActiveRuleKey(null);
  }

  function changeSelectedDateMonth(month: number): void {
    setSelectedDateMonth(month);
    setActiveRuleKey(null);
  }

  function changeSelectedDateDayOfMonth(dayOfMonth: number): void {
    setSelectedDateDayOfMonth(dayOfMonth);
    setActiveRuleKey(null);
  }

  function changeSelectedHolidayCountryCode(countryCode: HolidayCountryCode): void {
    setSelectedHolidayCountryCode(countryCode);
    setSelectedHolidayId(getHolidayDefinitions(countryCode)[0]?.holidayId ?? "");
    setHolidaySearchText("");
    setActiveRuleKey(null);
  }

  function changeHolidaySearchText(text: string): void {
    setHolidaySearchText(text);
    setActiveRuleKey(null);
  }

  function pickHoliday(option: SheetNarrowBeltOption<string>): void {
    setSelectedHolidayId(option.value);
    setHolidaySearchText(option.label);
    setActiveRuleKey(null);
  }

  function changeSelectedWeekdayMonth(month: number): void {
    setSelectedWeekdayMonth(month);
    if (month !== SCHEDULE_EVERY && selectedWeekday === SCHEDULE_EVERY) {
      setSelectedWeekday(1);
    }
    setActiveRuleKey(null);
  }

  function changeSelectedWeekdayPosition(position: number): void {
    setSelectedWeekdayPosition(position);
    if (position !== SCHEDULE_EVERY && selectedWeekday === SCHEDULE_EVERY) {
      setSelectedWeekday(1);
    }
    setActiveRuleKey(null);
  }

  return (
    <SheetModal
      visible={visible}
      owner="nagger-schedule-modal"
      title="Build schedule"
      onDismiss={onDismiss}
      footer={
        <SheetFooterActions>
          <SheetFooterSpacer />
          <SheetButton
            area="footer"
            label="Done"
            tone="primary"
            onPress={() => onDone(draftRules)}
          />
        </SheetFooterActions>
      }
    >
      <SheetSection>
        <SheetChipRow scrollToEndOnChange>
          {draftRules.length === 0 ? (
            <SheetChip label="Never" tone="selected" />
          ) : (
            draftRules.map((rule) => (
              <SheetChip
                key={rule.id}
                label={getScheduleRuleText(rule)}
                tone={getScheduleRuleKey(rule) === activeRuleKey ? "active" : "preview"}
                onPress={() => removeScheduleRule(rule.id)}
              />
            ))
          )}
        </SheetChipRow>
        <SheetText tone="status">{getPreviewText(previewDueOn)}</SheetText>
      </SheetSection>

      <SheetSection>
        <SheetHeadingBelt
          options={scheduleBuilderOptions}
          value={selectedBuilderType}
          onChange={changeSelectedBuilderType}
        />
        {selectedBuilderType === "Weekday" ? (
          <>
            <SheetWheel
              label="Month"
              options={monthWheelOptions}
              orientation="horizontal"
              value={selectedWeekdayMonth}
              onChange={changeSelectedWeekdayMonth}
            />
            <SheetWheel
              label="Position"
              options={positionWheelOptions}
              orientation="horizontal"
              value={selectedWeekdayPosition}
              onChange={changeSelectedWeekdayPosition}
            />
            <SheetWheel
              label="Day"
              options={weekdayWheelOptions}
              orientation="horizontal"
              value={selectedWeekday}
              onChange={changeSelectedWeekday}
            />
            <SheetButton
              area="body"
              label="Add"
              tone="primary"
              onPress={addSelectedWeekdayRule}
            />
          </>
        ) : selectedBuilderType === "Date" ? (
          <>
            <SheetWheel
              label="Year"
              options={yearWheelOptions}
              orientation="horizontal"
              value={selectedDateYear}
              onChange={changeSelectedDateYear}
            />
            <SheetWheel
              label="Month"
              options={monthWheelOptions}
              orientation="horizontal"
              value={selectedDateMonth}
              onChange={changeSelectedDateMonth}
            />
            <SheetWheel
              label="Day"
              options={dayOfMonthWheelOptions}
              orientation="horizontal"
              value={selectedDateDayOfMonth}
              onChange={changeSelectedDateDayOfMonth}
            />
            <SheetButton
              area="body"
              label="Add"
              tone="primary"
              onPress={addSelectedDateRule}
            />
          </>
        ) : (
          <>
            <SheetWheel
              label="Country"
              options={holidayCountryWheelOptions}
              orientation="horizontal"
              value={selectedHolidayCountryCode}
              onChange={changeSelectedHolidayCountryCode}
            />
            <SheetNarrowPicker
              edgeToEdge
              emptyText="No matching holidays."
              highlightMode="closest-match"
              onChangeText={changeHolidaySearchText}
              onPick={pickHoliday}
              options={holidayOptions}
              placeholder="Holiday"
              sortOptions={holidaySortOptions}
              value={holidaySearchText}
            />
            <SheetButton
              area="body"
              label="Add"
              tone="primary"
              onPress={addSelectedHolidayRule}
            />
          </>
        )}
      </SheetSection>
    </SheetModal>
  );
}

function isWeekdayRule(rule: ScheduleRule): rule is Extract<ScheduleRule, { ruleType: "Weekday" }> {
  return rule.ruleType === "Weekday";
}

function isSimpleWeekdayRule(rule: ScheduleRule): rule is Extract<ScheduleRule, { ruleType: "Weekday" }> {
  return (
    isWeekdayRule(rule) &&
    rule.rule.month === SCHEDULE_EVERY &&
    rule.rule.position === SCHEDULE_EVERY
  );
}

function removeConflictingSimpleWeekdayRules(
  draftRules: readonly ScheduleRule[],
  selectedRule: Extract<ScheduleRule, { ruleType: "Weekday" }>,
): readonly ScheduleRule[] {
  if (selectedRule.rule.weekday === SCHEDULE_EVERY) {
    return draftRules.filter((rule) => !isSimpleWeekdayRule(rule));
  }

  return draftRules.filter(
    (rule) => !isSimpleWeekdayRule(rule) || rule.rule.weekday !== SCHEDULE_EVERY,
  );
}

function resolveHolidayIdFromSearchText(
  holidayOptions: readonly SheetNarrowBeltOption<string>[],
  searchText: string,
  fallbackHolidayId: string,
): string {
  const normalizedSearchText = searchText.trim().toLocaleLowerCase();
  if (normalizedSearchText === "") return fallbackHolidayId;

  const matchingHolidays = holidayOptions
    .filter((holiday) => holiday.label.toLocaleLowerCase().includes(normalizedSearchText))
    .sort((left, right) => left.label.localeCompare(right.label));
  const exactHoliday = matchingHolidays.find(
    (holiday) => holiday.label.toLocaleLowerCase() === normalizedSearchText,
  );

  return exactHoliday?.value ?? matchingHolidays[0]?.value ?? "";
}

function canDateRuleEverMatch(year: number, month: number, day: number): boolean {
  if (day === SCHEDULE_EVERY || day === SCHEDULE_LAST_DAY) return true;
  if (month === SCHEDULE_EVERY) return true;
  if (year !== SCHEDULE_EVERY) return isValidLocalDate(year, month, day);
  if (month === 2) return day <= 29;

  return day <= getDaysInMonth(2027, month);
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function isValidLocalDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function getScheduleRuleText(rule: ScheduleRule): string {
  switch (rule.ruleType) {
    case "Weekday":
      return getWeekdayRuleText(rule);
    case "Date":
      return getDateRuleText(rule);
    case "Holiday":
      return getHolidayRuleText(rule);
  }
}

function getWeekdayRuleText(rule: Extract<ScheduleRule, { ruleType: "Weekday" }>): string {
  const monthLabel = getMonthLabel(rule.rule.month);
  const positionLabel = getPositionLabel(rule.rule.position);
  const weekdayLabel = getWeekdayLabel(rule.rule.weekday);

  if (rule.rule.month === SCHEDULE_EVERY && rule.rule.position === SCHEDULE_EVERY) {
    return weekdayLabel;
  }

  if (rule.rule.month === SCHEDULE_EVERY) {
    return `${positionLabel} ${weekdayLabel}`;
  }

  if (rule.rule.position === SCHEDULE_EVERY) {
    return `${monthLabel} ${weekdayLabel}`;
  }

  return `${monthLabel} ${positionLabel} ${weekdayLabel}`;
}

function getMonthLabel(month: number): string {
  return monthRules.find((rule) => rule.value === month)?.label ?? "Month";
}

function getPositionLabel(position: number): string {
  return positionRules.find((rule) => rule.value === position)?.label ?? "Position";
}

function getWeekdayLabel(weekday: number): string {
  return weekdayRules.find((rule) => rule.value === weekday)?.label ?? "Weekday";
}

function getDateRuleText(rule: Extract<ScheduleRule, { ruleType: "Date" }>): string {
  const labels = [
    rule.rule.year === SCHEDULE_EVERY ? null : String(rule.rule.year),
    rule.rule.month === SCHEDULE_EVERY ? null : getMonthLabel(rule.rule.month),
    rule.rule.dayOfMonth === SCHEDULE_EVERY ? null : getDayOfMonthLabel(rule.rule.dayOfMonth),
  ].filter((label) => label !== null);

  return labels.length === 0 ? "Every" : labels.join(" ");
}

function getHolidayRuleText(rule: Extract<ScheduleRule, { ruleType: "Holiday" }>): string {
  return getHolidayDefinition(rule.rule.countryCode, rule.rule.holidayId)?.label ?? "Holiday";
}

function getDayOfMonthLabel(dayOfMonth: number): string {
  return dayOfMonthRules.find((rule) => rule.value === dayOfMonth)?.label ?? "Day";
}

function getPreviewText(previewDueOn: string | null): string {
  if (previewDueOn === null) return "Due never";

  return `Next due ${previewDueOn}`;
}
