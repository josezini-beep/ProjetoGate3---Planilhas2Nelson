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
  }
};