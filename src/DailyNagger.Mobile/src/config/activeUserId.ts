import { environment } from "./environment";
import { appVariant } from "./appVariant";
import { getOrCreateClientId } from "@/services/clientIdentity";

// Keep in sync with DemoApi.TemplateUserId on the server.
export const demoEditorUserId = "019a23d0-7c00-7000-8000-000000000001";

// Personal builds retain their existing account; demo installs get their own saved identity.
const normalUserId = appVariant === "demo" ? getOrCreateClientId() : environment.userId;
let activeUserId = normalUserId;

export function getActiveUserId(): string {
  return activeUserId;
}

export function toggleDemoEditorUser(): void {
  activeUserId = activeUserId === demoEditorUserId ? normalUserId : demoEditorUserId;
}
