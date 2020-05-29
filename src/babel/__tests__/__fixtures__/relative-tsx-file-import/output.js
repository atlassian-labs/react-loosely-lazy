import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTsxFileImport = lazyForPaint(
  () => require('./__mocks__/imports/tsx-component'),
  {
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-tsx-file-import/__mocks__/imports/tsx-component.tsx',
  }
);
