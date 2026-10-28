import type { Memory, Sending } from "@/services/contracts";
import { toggleDemoEditorUser } from "@/config/activeUserId";

export function switchDemoUser(): void {
  toggleDemoEditorUser();
}

export type DemoRuntimeDependencies = {
  readonly memory: Memory;
  readonly sending: Sending;
};

export function addDemoData(_args: void, { memory, sending }: DemoRuntimeDependencies): void {
  memory.write.clear();
  sending.queue({ type: "demo-data", operation: "copy" });
}

export function deleteAllDemoData(_args: void, { memory, sending }: DemoRuntimeDependencies): void {
  memory.write.clear();
  sending.queue({ type: "demo-data", operation: "delete" });
}
