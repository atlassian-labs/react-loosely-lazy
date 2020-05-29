import { lazy } from 'react-loosely-lazy';
const ImplicitNoSsr = lazy(() => import('react'), {
  moduleId: './node_modules/react/index.js',
});
