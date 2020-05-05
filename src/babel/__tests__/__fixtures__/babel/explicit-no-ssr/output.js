import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSsr = lazyForPaint(() => import('./my-component'), {
  ssr: false,
  getCacheId: () =>
    (
      require.resolveWeak ||
      function (v) {
        return v;
      }
    )('./my-component'),
  moduleId: './my-component',
});
