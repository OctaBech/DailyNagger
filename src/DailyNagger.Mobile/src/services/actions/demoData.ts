import type { Memory, Sending, Startup } from "@/services/contracts";
import { toggleDemoEditorUser } from "@/config/activeUserId";

export function switchDemoUser(_args: void, { memory, startup }: DemoRuntimeDependencies): void {
  toggleDemoEditorUser();
  memory.write.clear();
  void startup.restart();
}

export type DemoRuntimeDependencies = {
  readonly memory: Memory;
  readonly sending: Sending;
  readonly startup: Startup;
};

export function addDemoData(_args: void, { memory, sending }: DemoRuntimeDependencies): void {
  memory.write.clear();
  sending.queue({ type: "demo-data", operation: "copy" });
}

export function deleteAllDemoData(_args: void, { memory, sending }: DemoRuntimeDependencies): void {
  memory.write.clear();
  sending.queue({ type: "demo-data", operation: "delete" });
}
