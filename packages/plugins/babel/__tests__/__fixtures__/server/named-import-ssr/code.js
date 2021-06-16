import { lazyForPaint } from 'react-loosely-lazy';

const NamedImport = lazyForPaint(() =>
  import('react').then(({ Component }) => Component)
);
