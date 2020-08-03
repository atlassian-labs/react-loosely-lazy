// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  resetMocks: true,
  setupFilesAfterEnv: ['<rootDir>jest.setup.js'],
  // Matches all test.tsx? files under the src directory that are not prefixed with flow, or typescript
  testRegex: ['\\/src\\/(.+\\/)*(.*(?<!(flow|typescript))\\.)?test\\.tsx?$'],
  verbose: true,
  // Webpack plugin test generates files which causes an infinite loop in watch mode if not ignored
  watchPathIgnorePatterns: ['src/webpack/__tests__/__fixtures__/output'],
};
