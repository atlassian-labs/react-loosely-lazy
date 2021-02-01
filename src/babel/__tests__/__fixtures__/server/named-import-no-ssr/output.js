import { lazy } from 'react-loosely-lazy';
const NamedImport = lazy(() => () => null, {
  moduleId: './node_modules/react/index.js',
});
