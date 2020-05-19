import { lazyForPaint } from 'react-loosely-lazy';

const RelativeModuleWithIndexImport = lazyForPaint(() =>
  import('./__mocks__/imports/module')
);
