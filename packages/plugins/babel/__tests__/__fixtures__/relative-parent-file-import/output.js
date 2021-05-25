import { lazyForPaint } from 'react-loosely-lazy';
const RelativeParentFileImport = lazyForPaint(
  () => require('../../__mocks__/imports/module'),
  {
    moduleId:
      './packages/plugins/babel/__tests__/__mocks__/imports/module/index.js',
  }
);
