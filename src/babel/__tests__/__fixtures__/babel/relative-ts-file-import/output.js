import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTypeScriptFileImport = lazyForPaint(
  () => {
    const resolved = require('./__mocks__/imports/file');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./__mocks__/imports/file');
      }

      return './__mocks__/imports/file';
    },
    moduleId:
      './src/babel/__tests__/__fixtures__/babel/relative-ts-file-import/__mocks__/imports/file.ts',
  }
);
