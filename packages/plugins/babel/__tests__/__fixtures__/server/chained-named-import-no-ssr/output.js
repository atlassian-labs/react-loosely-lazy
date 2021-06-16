import { lazy } from 'react-loosely-lazy';
const ChainedNamedImport = lazy(() => () => null, {
  moduleId: './node_modules/react/index.js',
});
