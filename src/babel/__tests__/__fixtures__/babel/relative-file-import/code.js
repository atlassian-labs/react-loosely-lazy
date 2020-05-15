import { lazyForPaint } from 'react-loosely-lazy';

const RelativeFileImport = lazyForPaint(() =>
  import('./__mocks__/imports/file')
);
