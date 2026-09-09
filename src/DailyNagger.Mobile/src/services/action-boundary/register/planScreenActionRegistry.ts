import type { Nagger } from "@/models";
import { navigationActions } from "@/services/actions";
import { registerAction } from "./actionRegistrationModel";

export const planScreenActionRegistry = {
  nagger: {
    setExpanded: registerAction(
      "navigation",
      navigationActions.naggerSetExpanded,
      (nagger: Nagger, isExpanded: boolean) => ({ nagger, isExpanded }),
    ),
  },
} as const;




