import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('react'), {
  ssr: false,
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('react');
    }

    return 'react';
  },
  moduleId: './node_modules/react/index.js',
});
