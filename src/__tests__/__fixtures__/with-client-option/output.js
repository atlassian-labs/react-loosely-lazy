import { lazyForPaint } from 'react-loosely-lazy';
const WithClientOption = lazyForPaint(() => import('./my-component'), {
  ssr: true,
  getCacheId: () => require.resolveWeak('./my-component'),
  moduleId: './my-component',
});
