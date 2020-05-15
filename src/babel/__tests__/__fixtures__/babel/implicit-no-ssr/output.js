import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('prop-types'), {
  ssr: false,
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('prop-types');
    }

    return 'prop-types';
  },
  moduleId: './node_modules/prop-types/index.js',
});
