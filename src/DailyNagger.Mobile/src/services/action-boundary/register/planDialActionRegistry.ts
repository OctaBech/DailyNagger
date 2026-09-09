import type { Nagger } from "@/models";
import { taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planDialActionRegistry = {
  dial: {
    pinSelectedNagger: registerAction(
      "task-input",
      taskInputActions.naggerPinSelected,
      (nagger: Nagger) => ({ nagger }),
    ),
    unpinSelectedNagger: registerAction(
      "task-input",
      taskInputActions.naggerUnpinSelected,
      (nagger: Nagger) => ({ nagger }),
    ),
  },
} as const;
