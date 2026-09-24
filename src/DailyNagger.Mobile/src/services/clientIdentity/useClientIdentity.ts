import { useMemo } from "react";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { createMMKV } from "react-native-mmkv";
import type { ClientIdentity } from "@/models";
import { newGuid } from "@/shared";

const storage = createMMKV({ id: "daily-nagger-client-identity" });
const clientIdStorageKey = "clientId";

export function useClientIdentity(): ClientIdentity {
  return useMemo(() => getClientIdentity(), []);
}

function getClientIdentity(): ClientIdentity {
  return {
    clientId: getOrCreateClientId(),
    deviceName: getDeviceName(),
    deviceModel: getDeviceModel(),
  };
}

function getOrCreateClientId(): string {
  const storedClientId = storage.getString(clientIdStorageKey);
  if (storedClientId !== undefined && storedClientId.trim().length > 0) {
    return storedClientId;
  }

  const clientId = newGuid();
  storage.set(clientIdStorageKey, clientId);
  return clientId;
}

function getDeviceName(): string {
  const model = getString(Device.modelName);
  const brand = getString(Device.brand) ?? getString(Device.manufacturer);

  if (brand !== undefined && model !== undefined) return `${brand} ${model}`;
  if (model !== undefined) return model;
  if (Platform.OS === "web") return getWebDeviceName();

  return `${Platform.OS} device`;
}

function getDeviceModel(): string {
  const model = getString(Device.modelName) ?? getString(Device.modelId);
  if (model !== undefined) return model;

  if (Platform.OS === "web") {
    return getWebUserAgent();
  }

  return Platform.OS;
}

function getWebDeviceName(): string {
  if (typeof navigator === "undefined") return "Web browser";

  const platform = navigator.platform?.trim();
  if (platform !== undefined && platform.length > 0) return `Web on ${platform}`;

  return "Web browser";
}

function getWebUserAgent(): string {
  if (typeof navigator === "undefined") return "web";

  return navigator.userAgent;
}

function getString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}
