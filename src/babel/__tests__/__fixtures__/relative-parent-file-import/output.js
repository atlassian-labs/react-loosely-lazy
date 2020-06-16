import { lazyForPaint } from 'react-loosely-lazy';
const RelativeParentFileImport = lazyForPaint(
  () => require('../../__mocks__/imports/module'),
  {
    moduleId: './src/babel/__tests__/__mocks__/imports/module/index.js',
  }
);
