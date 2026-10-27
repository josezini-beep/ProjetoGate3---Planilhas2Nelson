
module.exports = {
  testEnvironment: "node",

  roots: ["<rootDir>/src/tests"],

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
    "!src/**/*.test.ts",
    "!src/tests/**"
  ],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "html"]
};
