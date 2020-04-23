import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('./my-component'), {
  ssr: false,
  getCacheId: () => require.resolveWeak('./my-component'),
  moduleId: './my-component',
});
