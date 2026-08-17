import { useState } from "react";
import {
  SCHEDULE_EVERY,
  getScheduleRuleKey,
  type Nagger,
  type ScheduleRule,
  type ScheduleWeekday,
} from "@/models";
import { newGuid } from "@/shared";
import { SheetModal } from "./SheetModal";
import { SheetButton } from "./SheetButton";
import { SheetChip } from "./SheetChip";
import { SheetChipRow } from "./SheetChipRow";
import { SheetFooterActions } from "./SheetFooterActions";
import { SheetHeadingBelt } from "./SheetHeadingBelt";
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
  { label: "Every", value: 0 },
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
  const [selectedWeekday, setSelectedWeekday] = useState<ScheduleWeekday>(1);

  const [draftRules, setDraftRules] = useState<readonly ScheduleRule[]>(nagger.scheduleRules);
  const previewDueOn = getPreviewDueOn(draftRules);
  const selectedWeekdays = draftRules
    .filter(isWeekdayRule)
    .filter((rule) => rule.rule.month === SCHEDULE_EVERY && rule.rule.position === SCHEDULE_EVERY)
    .map((rule) => rule.rule.weekday);
  const displayRules = getDisplayRules(draftRules);

  function createWeekdayScheduleRule(weekday: ScheduleWeekday): ScheduleRule {
    return {
      id: newGuid(),
      ruleType: "Weekday",
      rule: {
        month: SCHEDULE_EVERY,
        position: SCHEDULE_EVERY,
        weekday,
      },
    };
  }

  function removeScheduleRule(ruleId: string): void {
    setDraftRules(draftRules.filter((rule) => rule.id !== ruleId));
  }

  function addSelectedWeekdayRule(): void {
    const selectedRule = createWeekdayScheduleRule(selectedWeekday);
    const selectedRuleKey = getScheduleRuleKey(selectedRule);

    if (draftRules.some((rule) => getScheduleRuleKey(rule) === selectedRuleKey)) return;

    const simpleWeekdayRulesV1 = draftRules.filter(
      (rule) =>
        !isWeekdayRule(rule) ||
        rule.rule.month !== SCHEDULE_EVERY ||
        rule.rule.position !== SCHEDULE_EVERY ||
        (selectedWeekday !== SCHEDULE_EVERY && rule.rule.weekday !== SCHEDULE_EVERY),
    );

    const draftRulesV1 =
      selectedWeekday === SCHEDULE_EVERY
        ? draftRules.filter(
            (rule) =>
              !isWeekdayRule(rule) ||
              rule.rule.month !== SCHEDULE_EVERY ||
              rule.rule.position !== SCHEDULE_EVERY,
          )
        : simpleWeekdayRulesV1;

    setDraftRules([...draftRulesV1, selectedRule]);
  }

  return (
    <SheetModal
      visible={visible}
      owner="nagger-schedule-modal"
      title="Build schedule"
      onDismiss={onDismiss}
      footer={
        <SheetFooterActions>
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
        <SheetChipRow>
          {draftRules.length === 0 ? (
            <SheetChip label="Never" tone="selected" />
          ) : (
            displayRules.map((rule) => (
              <SheetChip
                key={rule.id}
                label={getScheduleRuleText(rule)}
                tone="selected"
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
          onChange={setSelectedBuilderType}
        />
        {selectedBuilderType === "Weekday" ? (
          <>
            <SheetWheel
              label="Day"
              markedValues={selectedWeekdays}
              options={weekdayWheelOptions}
              orientation="horizontal"
              value={selectedWeekday}
              onChange={setSelectedWeekday}
            />
            <SheetButton
              area="body"
              label="Add"
              tone="primary"
              onPress={addSelectedWeekdayRule}
            />
          </>
        ) : (
          <SheetText tone="placeholder">{getBuilderPlaceholderText(selectedBuilderType)}</SheetText>
        )}
      </SheetSection>
    </SheetModal>
  );
}

function isWeekdayRule(rule: ScheduleRule): rule is Extract<ScheduleRule, { ruleType: "Weekday" }> {
  return rule.ruleType === "Weekday";
}

function getDisplayRules(draftRules: readonly ScheduleRule[]): readonly ScheduleRule[] {
  const weekdayRuleIndexByValue = new Map(
    weekdayRules.map((weekdayRule, index) => [weekdayRule.value, index]),
  );
  const weekdayRulesV1 = draftRules
    .filter(isWeekdayRule)
    .sort(
      (left, right) =>
        weekdayRuleIndexByValue.get(left.rule.weekday)! -
        weekdayRuleIndexByValue.get(right.rule.weekday)!,
    );
  const nonWeekdayRules = draftRules.filter((rule) => !isWeekdayRule(rule));

  return [...weekdayRulesV1, ...nonWeekdayRules];
}

function getScheduleRuleText(rule: ScheduleRule): string {
  switch (rule.ruleType) {
    case "Weekday":
      return weekdayRules.find((weekdayRule) => weekdayRule.value === rule.rule.weekday)?.label ??
        "Weekday";
    case "Date":
      return "Date";
    case "Holiday":
      return "Holiday";
  }
}

function getPreviewText(previewDueOn: string | null): string {
  if (previewDueOn === null) return "Due never";

  return `Next due ${previewDueOn}`;
}

function getBuilderPlaceholderText(builderType: ScheduleBuilderType): string {
  switch (builderType) {
    case "Weekday":
      return "Weekday rules go here.";
    case "Date":
      return "Date rules go here.";
    case "Holiday":
      return "Holiday rules go here.";
  }
}
