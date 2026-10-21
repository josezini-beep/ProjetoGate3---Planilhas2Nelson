
module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  testMatch: ["**/*.test.ts"],

  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/dist/"
  ],

  transform: {
    "^.+\\.tsx?$": "babel-jest"
  },

  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "html"]
};
