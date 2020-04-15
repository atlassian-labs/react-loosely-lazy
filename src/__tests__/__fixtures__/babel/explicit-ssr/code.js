import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitSsr = lazyForPaint(() => import('./my-component'), {
  ssr: true,
  defer: 0,
});
