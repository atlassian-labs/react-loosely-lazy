import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('./my-component'), {
  ssr: false,
  getCacheId: function () {
    if (require && require.resolveWeak) {
      return require.resolveWeak('./my-component');
    }

    return './my-component';
  },
  moduleId: './my-component',
});
