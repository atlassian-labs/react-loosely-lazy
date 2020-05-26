import { lazyForPaint } from 'react-loosely-lazy';
const NamedImport = lazyForPaint(
  () => import('react').then(({ Component }) => Component),
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
