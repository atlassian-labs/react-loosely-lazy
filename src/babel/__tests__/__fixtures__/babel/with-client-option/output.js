import { lazyForPaint } from 'react-loosely-lazy';
const WithClientOption = lazyForPaint(() => import('./my-component'), {
  ssr: true,
  getCacheId: () =>
    (
      require.resolveWeak ||
      function (v) {
        return v;
      }
    )('./my-component'),
  moduleId: './my-component',
});
