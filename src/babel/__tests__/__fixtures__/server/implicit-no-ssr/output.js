import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('react'), {
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('react');
    }

    return 'react';
  },
  moduleId: './node_modules/react/index.js',
});
