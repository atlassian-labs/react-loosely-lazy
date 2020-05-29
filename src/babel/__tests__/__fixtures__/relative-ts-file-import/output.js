import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTypeScriptFileImport = lazyForPaint(
  () => require('./__mocks__/imports/ts-component'),
  {
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-ts-file-import/__mocks__/imports/ts-component.ts',
  }
);
