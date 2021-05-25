const tsconfig = require('./tsconfig.json');

const { paths } = tsconfig.compilerOptions;

const moduleNameMapper = Object.entries(paths).reduce(
  (acc, [key, path]) => ({
    ...acc,
    [`^${key}$`]: `<rootDir>/${path}`,
  }),
  {}
);

module.exports = {
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper,
  resetMocks: true,
  setupFilesAfterEnv: ['<rootDir>jest.setup.js'],
  // Matches all test.tsx? files under the src directory that are not prefixed with flow, or typescript
  testRegex: [
    '\\/packages\\/(.+\\/)*(.*(?<!(flow|typescript))\\.)?test\\.tsx?$',
  ],
  testTimeout: 10000,
  verbose: true,
  // Webpack plugin test generates files which causes an infinite loop in watch mode if not ignored
  watchPathIgnorePatterns: ['packages/plugins/webpack/__tests__/app/dist'],
};
