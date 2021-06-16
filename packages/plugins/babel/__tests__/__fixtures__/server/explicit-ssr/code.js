import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitSSR = lazyForPaint(() => import('react'), {
  ssr: true,
});
