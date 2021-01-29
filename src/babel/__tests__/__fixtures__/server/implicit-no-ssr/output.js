import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => () => null, {
  moduleId: './node_modules/react/index.js',
});
