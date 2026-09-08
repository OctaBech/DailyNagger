import type { Nagger } from "@/models";
import { navigationActions } from "../actions";
import { registeredAction } from "./actionModel";

export const planScreenActionRegistry = {
  nagger: {
    setExpanded: registeredAction(
      "navigation",
      navigationActions.naggerSetExpanded,
      (nagger: Nagger, isExpanded: boolean) => ({ nagger, isExpanded }),
    ),
  },
} as const;
