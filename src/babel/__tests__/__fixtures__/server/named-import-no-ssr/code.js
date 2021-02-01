import { lazy } from 'react-loosely-lazy';

const NamedImport = lazy(() =>
  import('react').then(({ Component }) => Component)
);
