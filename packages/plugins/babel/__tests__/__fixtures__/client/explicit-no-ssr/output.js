import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSsr = lazyForPaint(() => import('react'), {
  ssr: false,
  moduleId: './node_modules/react/index.js',
});
