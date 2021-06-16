import { lazyForPaint } from 'react-loosely-lazy';
const RelativeModuleWithIndexImport = lazyForPaint(
  () => require('./__mocks__/imports/module'),
  {
    moduleId:
      './packages/plugins/babel/__tests__/__fixtures__/relative-module-with-index-import/__mocks__/imports/module/index.js',
  }
);
