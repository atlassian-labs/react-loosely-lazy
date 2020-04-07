import { lazyForPaint } from 'react-loosely-lazy';

const ExplicitNoSsr = lazyForPaint(() => import('./my-component'), {
  ssr: false,
});
