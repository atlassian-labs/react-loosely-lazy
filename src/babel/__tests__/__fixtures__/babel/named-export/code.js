import { lazyForPaint } from 'react-loosely-lazy';

const NamedExport = lazyForPaint(
  () => import('prop-types').then(mod => mod.Component),
  {
    ssr: true,
  }
);
