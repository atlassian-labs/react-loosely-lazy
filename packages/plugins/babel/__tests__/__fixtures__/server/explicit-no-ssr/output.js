import { lazyForPaint } from 'react-loosely-lazy';
const ExplicitNoSsr = lazyForPaint(() => () => null, {
  ssr: false,
  moduleId: './node_modules/react/index.js',
});
