import { lazyForPaint } from './node_modules/react-loosely-lazy';

const RelativeFileImport = lazyForPaint(() =>
  import('./__mocks__/imports/file')
);
