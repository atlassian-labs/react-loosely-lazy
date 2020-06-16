import { lazyForPaint } from 'react-loosely-lazy';

const RelativeShadowedFileImport = lazyForPaint(() =>
  import('./index')
);
