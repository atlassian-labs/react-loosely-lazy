import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitSsr = lazyForPaint(() => import('prop-types'), {
  ssr: true,
  defer: 0,
});
