import { lazyForPaint } from 'react-loosely-lazy';

const WithClientOption = lazyForPaint(() => import('react'), {
  ssr: true,
});
