import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Nagger, ScheduleRule } from "@/models";
import { newGuid } from "@/shared";
import { SheetModal } from "./SheetModal";

type ScheduleTab = "weekdays" | "dates" | "special";

const weekdayRules = [
  { label: "Mon", ruleType: "Monday" },
  { label: "Tue", ruleType: "Tuesday" },
  { label: "Wed", ruleType: "Wednesday" },
  { label: "Thu", ruleType: "Thursday" },
  { label: "Fri", ruleType: "Friday" },
  { label: "Sat", ruleType: "Saturday" },
  { label: "Sun", ruleType: "Sunday" },
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

  const [selectedTab, setSelectedTab] = useState<ScheduleTab>("weekdays");

  const [draftRules, setDraftRules] = useState<readonly ScheduleRule[]>(nagger.scheduleRules);
  const previewDueOn = getPreviewDueOn(draftRules);

  function addScheduleRule(
    ruleType: ScheduleRule["ruleType"],
    values: Pick<ScheduleRule, "year" | "month" | "day"> = {
      year: null,
      month: null,
      day: null,
    },
  ): void {
    const newRule: ScheduleRule = {
      id: newGuid(),
      ruleType,
      ...values,
    };

    const ruleAlreadyExists = draftRules.some(
      (rule) =>
        rule.ruleType === newRule.ruleType &&
        rule.year === newRule.year &&
        rule.month === newRule.month &&
        rule.day === newRule.day,
    );

    if (ruleAlreadyExists) return;

    setDraftRules([...draftRules, newRule]);
  }

  function removeScheduleRule(ruleId: string): void {
    setDraftRules(draftRules.filter((rule) => rule.id !== ruleId));
  }

  return (
    <SheetModal
      visible={visible}
      owner="nagger-schedule-modal"
      title="Build schedule"
      onDismiss={onDismiss}
      footer={
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.doneButton]} onPress={() => onDone(draftRules)}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
        </View>
      }
    >
        <View style={styles.selectedRules}>
          {draftRules.length === 0 ? (
            <Text selectable={false} style={styles.ruleChip}>
              Never
            </Text>
          ) : (
            draftRules.map((rule) => (
              <Pressable key={rule.id} onPress={() => removeScheduleRule(rule.id)}>
                <Text selectable={false} style={styles.ruleChip}>
                  {getScheduleRuleText(rule)}
                </Text>
              </Pressable>
            ))
          )}
          <Text selectable={false} style={styles.previewChip}>
            {getPreviewText(previewDueOn)}
          </Text>
        </View>

        <View style={styles.builder}>
          <View style={styles.tabs}>
            <Pressable
              style={[styles.tabButton, selectedTab === "weekdays" && styles.selectedTabButton]}
              onPress={() => setSelectedTab("weekdays")}
            >
              <Text style={styles.tabButtonText}>Weekdays</Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, selectedTab === "dates" && styles.selectedTabButton]}
              onPress={() => setSelectedTab("dates")}
            >
              <Text style={styles.tabButtonText}>Dates</Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, selectedTab === "special" && styles.selectedTabButton]}
              onPress={() => setSelectedTab("special")}
            >
              <Text style={styles.tabButtonText}>Special</Text>
            </Pressable>
          </View>

          <View style={styles.tabContent}>
            {selectedTab === "weekdays" ? (
              <View style={styles.weekdayButtons}>
                {weekdayRules.map((rule) => (
                  <Pressable
                    key={rule.ruleType}
                    style={styles.ruleButton}
                    onPress={() => addScheduleRule(rule.ruleType)}
                  >
                    <Text style={styles.ruleButtonText}>{rule.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholderText}>{getTabPlaceholderText(selectedTab)}</Text>
            )}
          </View>
        </View>
    </SheetModal>
  );
}

function getScheduleRuleText(rule: ScheduleRule): string {
  switch (rule.ruleType) {
    case "Monday":
      return "Mon";
    case "Tuesday":
      return "Tue";
    case "Wednesday":
      return "Wed";
    case "Thursday":
      return "Thu";
    case "Friday":
      return "Fri";
    case "Saturday":
      return "Sat";
    case "Sunday":
      return "Sun";
    default:
      return rule.ruleType;
  }
}

function getPreviewText(previewDueOn: string | null): string {
  if (previewDueOn === null) return "Due never";

  return `Next due ${previewDueOn}`;
}

function getTabPlaceholderText(selectedTab: ScheduleTab): string {
  switch (selectedTab) {
    case "weekdays":
      return "Weekday rules go here.";
    case "dates":
      return "Date rules go here.";
    case "special":
      return "Special rules go here.";
  }
}

const styles = StyleSheet.create({
  selectedRules: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ruleChip: {
    backgroundColor: "#e7ddff",
    borderColor: "#b9a7df",
    borderRadius: 8,
    borderWidth: 1,
    color: "#18242b",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewChip: {
    color: "#58656d",
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  button: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: "#18242b",
    fontSize: 16,
    fontWeight: "800",
  },

  builder: {
    alignItems: "flex-start",
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 220,
  },
  tabs: {
    alignItems: "stretch",
    gap: 8,
    width: 112,
  },
  tabButton: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  selectedTabButton: {
    backgroundColor: "#e7ddff",
    borderColor: "#b9a7df",
  },
  tabButtonText: {
    color: "#18242b",
    fontSize: 14,
    fontWeight: "800",
  },
  tabContent: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  placeholderText: {
    color: "#58656d",
    fontSize: 14,
    fontWeight: "700",
  },
  weekdayButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ruleButton: {
    borderColor: "#d8d1c9",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ruleButtonText: {
    color: "#18242b",
    fontSize: 15,
    fontWeight: "800",
  },
  doneButton: {
    backgroundColor: "#d67b32",
    borderColor: "#d67b32",
  },
});
