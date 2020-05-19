import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitSsr = lazyForPaint(() => import('react'), {
  ssr: true,
  defer: 0,
});
