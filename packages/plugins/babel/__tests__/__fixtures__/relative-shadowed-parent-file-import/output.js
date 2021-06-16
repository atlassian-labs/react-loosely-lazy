import { lazyForPaint } from 'react-loosely-lazy';
const RelativeShadowedParentFileImport = lazyForPaint(
  () => require('../index'),
  {
    moduleId: './packages/plugins/babel/__tests__/__fixtures__/index.js',
  }
);
