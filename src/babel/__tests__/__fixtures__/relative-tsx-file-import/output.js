import { lazyForPaint } from 'react-loosely-lazy';
const RelativeTsxFileImport = lazyForPaint(
  () => {
    const resolved = require('./__mocks__/imports/tsx-component');

    const then = fn => fn(resolved);

    return { ...resolved, then };
  },
  {
    ssr: true,
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('./__mocks__/imports/tsx-component');
      }

      return './__mocks__/imports/tsx-component';
    },
    moduleId:
      './src/babel/__tests__/__fixtures__/relative-tsx-file-import/__mocks__/imports/tsx-component.tsx',
  }
);
