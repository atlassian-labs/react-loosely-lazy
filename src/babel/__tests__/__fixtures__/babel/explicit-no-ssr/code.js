import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitNoSsr = lazyForPaint(
  () => import('react-loosely-lazy-component'),
  {
    ssr: false,
  }
);
