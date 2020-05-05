import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('./my-component'), {
  ssr: false,
  getCacheId: (
    require.resolveWeak ||
    function (v) {
      return v;
    }
  )('./my-component'),
  moduleId: './my-component',
});
