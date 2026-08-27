import * as Sentry from "@sentry/react-native";
import type { CommandKind } from "@/services/command-boundary/commandModel";
import type { CommandSource } from "@/services/command-boundary/useCommandDispatcher";
import type { CommandTraceKey } from "./commandTraceKey";

type CommandOperationInput = {
  readonly commandKind: CommandKind;
  readonly commandSource: CommandSource;
  readonly commandTraceKey: CommandTraceKey;
};

export function recordCommandOperation<TResult>(
  input: CommandOperationInput,
  run: () => TResult,
): TResult {
  Sentry.addBreadcrumb({
    category: "command",
    data: {
      commandKind: input.commandKind,
      commandSource: input.commandSource,
      commandTraceKey: input.commandTraceKey,
    },
    level: "info",
    message: input.commandKind,
  });

  if (Sentry.getActiveSpan() === undefined) {
    return run();
  }

  return Sentry.startSpan(
    {
      attributes: {
        "command.kind": input.commandKind,
        "command.source": input.commandSource,
        commandTraceKey: input.commandTraceKey,
      },
      name: input.commandKind,
      op: "command.execute",
    },
    run,
  );
}
