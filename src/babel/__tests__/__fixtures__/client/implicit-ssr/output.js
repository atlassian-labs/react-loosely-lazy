import { lazyForPaint } from 'react-loosely-lazy';
const ImplicitSsr = lazyForPaint(() => import('react'), {
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('react');
    }

    return 'react';
  },
  moduleId: './node_modules/react/index.js',
});
