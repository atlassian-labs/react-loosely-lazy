import { lazyForPaint } from 'react-loosely-lazy';
const ImplicitSsr = lazyForPaint(() => require('react'), {
  moduleId: './node_modules/react/index.js',
});
