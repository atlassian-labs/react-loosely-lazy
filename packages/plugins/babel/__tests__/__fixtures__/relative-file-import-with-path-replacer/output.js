import { lazyForPaint } from 'react-loosely-lazy';
const RelativeFileImportWithBasePath = lazyForPaint(
  () => require('./__mocks__/imports/base-path-component'),
  {
    moduleId:
      './foo/plugins/babel/__tests__/__fixtures__/relative-file-import-with-path-replacer/__mocks__/imports/base-path-component.js',
  }
);
