import { lazyForPaint } from 'react-loosely-lazy';

const RelativeShadowedParentFileImport = lazyForPaint(() =>
  import('../index')
);
