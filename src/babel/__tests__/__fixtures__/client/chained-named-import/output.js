import { lazyForPaint } from 'react-loosely-lazy';
const ChainedNamedImport = lazyForPaint(
  () =>
    import('react')
      .then(({ Component }) => Component)
      .then(mod => {
        return mod;
      })
      .then(mod => mod),
  {
    getCacheId: function () {
      if (require && require.resolveWeak) {
        return require.resolveWeak('react');
      }

      return 'react';
    },
    moduleId: './node_modules/react/index.js',
  }
);
