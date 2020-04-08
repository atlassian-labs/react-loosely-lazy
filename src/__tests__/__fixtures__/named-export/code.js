import { lazyForPaint } from 'react-loosely-lazy';

const NamedExport = lazyForPaint(
  () => import('./my-component').then(mod => mod.Component),
  {
    ssr: true,
  }
);
