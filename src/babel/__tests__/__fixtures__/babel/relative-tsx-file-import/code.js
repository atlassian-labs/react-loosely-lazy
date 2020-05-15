import { lazyForPaint } from 'react-loosely-lazy';

const RelativeTsxFileImport = lazyForPaint(() =>
  import('./__mocks__/imports/file')
);
