import { lazyForPaint } from 'react-loosely-lazy';
const RelativeModuleWithIndexImport = lazyForPaint(
  () => {
    const resolved = require('./__mocks__/imports/module');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./__mocks__/imports/module');
      }

      return './__mocks__/imports/module';
    },
    moduleId:
      './src/babel/__tests__/__fixtures__/babel/relative-module-with-index-import/__mocks__/imports/module/index.js',
  }
);
