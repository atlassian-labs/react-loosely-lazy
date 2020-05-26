import { lazyForPaint } from 'react-loosely-lazy';
const RelativeModuleWithIndexImport = lazyForPaint(
  () => require('./__mocks__/imports/module'),
  {
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./__mocks__/imports/module');
      }

      return './__mocks__/imports/module';
    },
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-module-with-index-import/__mocks__/imports/module/index.js',
  }
);
