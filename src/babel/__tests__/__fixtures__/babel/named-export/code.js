import { lazyForPaint } from 'react-loosely-lazy';

const NamedExport = lazyForPaint(
  () => import('react').then(mod => mod.Component),
  {
    ssr: true,
  }
);
