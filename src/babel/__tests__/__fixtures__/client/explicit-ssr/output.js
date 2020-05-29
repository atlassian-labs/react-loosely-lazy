import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitSSR = lazyForPaint(() => import('react'), {
  ssr: true,
  moduleId: './node_modules/react/index.js',
});
