module.exports = function (api) {
  const isWhyDidYouRenderEnabled =
    process.env.EXPO_PUBLIC_DAILY_NAGGER_WHY_DID_YOU_RENDER === "true";

  api.cache(() => isWhyDidYouRenderEnabled);

  return {
    presets: [
      isWhyDidYouRenderEnabled
        ? [
            "babel-preset-expo",
            {
              jsxImportSource: "@welldone-software/why-did-you-render",
            },
          ]
        : "babel-preset-expo",
    ],
  };
};
