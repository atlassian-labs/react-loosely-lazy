import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitSsr = lazyForPaint(() => import('react-loosely-lazy-component'), {
  ssr: true,
  defer: 0,
});
