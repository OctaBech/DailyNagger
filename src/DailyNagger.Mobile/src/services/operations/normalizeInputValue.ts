import type { TaskEntryValueType } from "@/api/dto";
import { assertNever } from "@/shared";

export function normalizeInputValue(
  valueType: TaskEntryValueType,
  newValue: string | null,
): string | null {
  switch (valueType) {
    case "Text":
      return normalizeText(newValue);
    case "Boolean":
      return normalizeBoolean(newValue);
    case "Integer":
      return normalizeInteger(newValue);
    case "Decimal":
      return normalizeDecimal(newValue);
    default:
      return assertNever(valueType);
  }
}

function normalizeBoolean(newValue: string | null): string {
  if (!newValue) return "false";
  if (newValue.trim() === "") return "false";
  if (newValue === "true") return "true";
  if (newValue === "false") return "false";

  throw new Error(`Bad boolean value: ${newValue}`);
}

function normalizeText(newValue: string | null): string | null {
  if (!newValue) return null;
  if (newValue.trim() === "") return null;
  return newValue;
}

function normalizeDecimal(newValue: string | null): string | null {
  if (!newValue) return null;
  if (newValue.trim() === "") return null;

  const isNumber = !isNaN(Number(newValue));

  if (!isNumber) throw new Error(`Bad decimal value: ${newValue}`);

  return newValue;
}

function normalizeInteger(newValue: string | null): string | null {
  if (!newValue) return null;
  if (newValue.trim() === "") return null;

  const isInteger = Number.isInteger(Number(newValue));

  if (!isInteger) throw new Error(`Bad integer value: ${newValue}`);

  const parsedInteger = parseInt(newValue, 10);
  const textInteger = parsedInteger.toString();

  return textInteger;
}
