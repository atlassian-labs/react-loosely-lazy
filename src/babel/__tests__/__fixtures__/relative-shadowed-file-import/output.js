import { lazyForPaint } from 'react-loosely-lazy';
const RelativeShadowedFileImport = lazyForPaint(() => require('./index'), {
  moduleId:
    './src/babel/__tests__/__fixtures__/relative-shadowed-file-import/index.js',
});
