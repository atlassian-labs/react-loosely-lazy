import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitSSR = lazyForPaint(() => require('react'), {
  ssr: true,
  moduleId: './node_modules/react/index.js',
});
