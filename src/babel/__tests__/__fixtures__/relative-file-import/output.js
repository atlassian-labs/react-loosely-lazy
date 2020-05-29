import { lazyForPaint } from 'react-loosely-lazy';
const RelativeFileImport = lazyForPaint(
  () => require('./__mocks__/imports/js-component'),
  {
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-file-import/__mocks__/imports/js-component.js',
  }
);
