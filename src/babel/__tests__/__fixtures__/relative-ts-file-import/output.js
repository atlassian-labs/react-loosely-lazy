import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTypeScriptFileImport = lazyForPaint(
  () => require('./__mocks__/imports/ts-component'),
  {
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./__mocks__/imports/ts-component');
      }

      return './__mocks__/imports/ts-component';
    },
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-ts-file-import/__mocks__/imports/ts-component.ts',
  }
);
