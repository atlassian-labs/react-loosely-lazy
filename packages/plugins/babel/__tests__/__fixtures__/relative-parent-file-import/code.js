import { lazyForPaint } from 'react-loosely-lazy';

const RelativeParentFileImport = lazyForPaint(() =>
  import('../../__mocks__/imports/module')
);
