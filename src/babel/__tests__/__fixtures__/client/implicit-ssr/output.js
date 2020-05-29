import { lazyForPaint } from 'react-loosely-lazy';
const ImplicitSsr = lazyForPaint(() => import('react'), {
  moduleId: './node_modules/react/index.js',
});
