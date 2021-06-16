import { lazy } from 'react-loosely-lazy';

const ChainedNamedImport = lazy(() =>
  import('react')
    .then(({ Component }) => Component)
    .then(mod => {
      return mod;
    })
    .then(mod => mod)
);
