import type { Nagger } from "@/models";
import { taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planDialActionRegistry = {
  dial: {
    pinSelectedNagger: registerAction(
      taskInputActions.naggerPinSelected,
      (nagger: Nagger) => ({ nagger }),
      "plan/task-input",
    ),
    unpinSelectedNagger: registerAction(
      taskInputActions.naggerUnpinSelected,
      (nagger: Nagger) => ({ nagger }),
      "plan/task-input",
    ),
  },
} as const;
