import { lazyForPaint } from 'react-loosely-lazy';

const RelativeTypeScriptFileImport = lazyForPaint(() =>
  import('./__mocks__/imports/file')
);
