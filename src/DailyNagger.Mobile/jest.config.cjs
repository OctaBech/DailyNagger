module.exports = {
  preset: "jest-expo",

  moduleDirectories: ["node_modules", "<rootDir>/node_modules/expo/node_modules"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@api-contracts$": "<rootDir>/../api-contracts/src/index",
  },
};
