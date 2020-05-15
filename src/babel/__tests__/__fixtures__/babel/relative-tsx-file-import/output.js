import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTsxFileImport = lazyForPaint(
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
      './src/babel/__tests__/__fixtures__/babel/relative-tsx-file-import/__mocks__/imports/file.tsx',
  }
);
