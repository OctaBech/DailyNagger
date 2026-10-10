import { taskInputActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planDialActionRegistry = {
  dial: {
    pinSelectedNagger: registerAction(taskInputActions.naggerPinSelected, "plan/task-input"),
    unpinSelectedNagger: registerAction(taskInputActions.naggerUnpinSelected, "plan/task-input"),
  },
} as const;
