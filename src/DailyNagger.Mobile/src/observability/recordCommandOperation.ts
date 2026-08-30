import type { CommandArgs, CommandKind } from "@/services/command-boundary/commandModel";
import { buildCommandObservabilityContext, type Observability } from "./observabilityContext";
import { recordObservability } from "./recordObservability";

export function recordCommandOperation<TKey extends CommandKind>(
  source: string,
  kind: TKey,
  args: CommandArgs<TKey>,
): Observability {
  const context = buildCommandObservabilityContext(source, kind, args);

  return recordObservability({
    breadcrumbCategory: "command",
    context,
    operation: "dn.command",
  });
}
