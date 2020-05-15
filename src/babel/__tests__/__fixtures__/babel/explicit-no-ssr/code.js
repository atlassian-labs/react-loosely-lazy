import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitNoSsr = lazyForPaint(() => import('prop-types'), {
  ssr: false,
});
