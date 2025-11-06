/**
 * Jest設定 - Electronアプリケーション用
 *
 * メインプロセス、プリロードスクリプト、サービス層のユニットテストを実行
 */

module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/electron/**/__tests__/**/*.test.js",
    "**/tests/unit/**/*.test.js",
  ],
  collectCoverageFrom: [
    "electron/**/*.js",
    "!electron/**/__tests__/**",
    "!electron/test-*.js",
    "!electron/verify-*.js",
    "!electron/main.js", // メインプロセスは統合テストでカバー
  ],
  coverageDirectory: "coverage/electron",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.js"],
  moduleNameMapper: {
    "^electron$": "<rootDir>/tests/mocks/electron.mock.js",
  },
  testTimeout: 10000,
  verbose: true,
};
