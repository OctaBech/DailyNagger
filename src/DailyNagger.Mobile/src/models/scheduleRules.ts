import type { ScheduleRuleDto } from "@/api";
import type { Guid } from "@/shared";

export const SCHEDULE_EVERY = 0;
export const SCHEDULE_LAST_DAY = 32;
export const SCHEDULE_LAST_POSITION = 5;

export type ScheduleRuleType = "Weekday" | "Date" | "Holiday";
export type ScheduleWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeekdayScheduleRuleBody = {
  readonly month: number;
  readonly position: number;
  readonly weekday: ScheduleWeekday;
};

export type DateScheduleRuleBody = {
  readonly year: number;
  readonly month: number;
  readonly dayOfMonth: number;
};

export type HolidayScheduleRuleBody = {
  readonly countryCode: string;
  readonly holidayId: string;
};

export type WeekdayScheduleRule = {
  readonly id: Guid;
  readonly ruleType: "Weekday";
  readonly rule: WeekdayScheduleRuleBody;
};

export type DateScheduleRule = {
  readonly id: Guid;
  readonly ruleType: "Date";
  readonly rule: DateScheduleRuleBody;
};

export type HolidayScheduleRule = {
  readonly id: Guid;
  readonly ruleType: "Holiday";
  readonly rule: HolidayScheduleRuleBody;
};

export type ScheduleRule = WeekdayScheduleRule | DateScheduleRule | HolidayScheduleRule;

export function scheduleRuleDtoToModel(dto: ScheduleRuleDto): ScheduleRule {
  const rule = JSON.parse(dto.ruleJson) as unknown;

  if (dto.ruleType === "Weekday") {
    return {
      id: dto.id,
      ruleType: dto.ruleType,
      rule: rule as WeekdayScheduleRuleBody,
    };
  }

  if (dto.ruleType === "Date") {
    return {
      id: dto.id,
      ruleType: dto.ruleType,
      rule: rule as DateScheduleRuleBody,
    };
  }

  return {
    id: dto.id,
    ruleType: dto.ruleType,
    rule: rule as HolidayScheduleRuleBody,
  };
}

export function scheduleRuleModelToDto(rule: ScheduleRule): ScheduleRuleDto {
  return {
    id: rule.id,
    ruleType: rule.ruleType,
    ruleJson: JSON.stringify(rule.rule),
  };
}

export function getScheduleRuleKey(rule: ScheduleRule): string {
  switch (rule.ruleType) {
    case "Weekday":
      return `Weekday:${rule.rule.month}:${rule.rule.position}:${rule.rule.weekday}`;
    case "Date":
      return `Date:${rule.rule.year}:${rule.rule.month}:${rule.rule.dayOfMonth}`;
    case "Holiday":
      return `Holiday:${rule.rule.countryCode}:${rule.rule.holidayId}`;
  }
}
