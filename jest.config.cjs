module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  testMatch: ["**/*.test.ts"],

  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/dist/"
  ]
};