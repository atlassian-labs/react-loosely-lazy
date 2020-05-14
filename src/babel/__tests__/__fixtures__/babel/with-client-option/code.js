import { lazyForPaint } from 'react-loosely-lazy';

const WithClientOption = lazyForPaint(
  () => import('react-loosely-lazy-component'),
  {
    ssr: true,
  }
);
