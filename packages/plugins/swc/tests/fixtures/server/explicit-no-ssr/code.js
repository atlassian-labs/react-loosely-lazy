import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitNoSSR = lazyForPaint(() => import('react'), {
  ssr: false,
});