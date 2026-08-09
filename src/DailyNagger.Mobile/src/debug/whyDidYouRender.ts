/// <reference types="@welldone-software/why-did-you-render" />

import React from "react";
import whyDidYouRender from "@welldone-software/why-did-you-render";

const isEnabled = process.env.EXPO_PUBLIC_DAILY_NAGGER_WHY_DID_YOU_RENDER === "true";

if (__DEV__ && isEnabled) {
  whyDidYouRender(React, {
    collapseGroups: true,
    include: [/NagCard/, /TaskLogCard/, /TaskItemCard/, /TaskEntryCard/, /SpeedDial/],
    logOwnerReasons: false,
    trackAllPureComponents: true,
  });
}
