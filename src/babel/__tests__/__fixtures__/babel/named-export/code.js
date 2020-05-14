import { lazyForPaint } from 'react-loosely-lazy';

const NamedExport = lazyForPaint(
  () => import('react-loosely-lazy-component').then(mod => mod.Component),
  {
    ssr: true,
  }
);
