import { lazyForPaint } from 'react-loosely-lazy';

const RelativeFileImportWithBasePath = lazyForPaint(() =>
  import('./__mocks__/imports/base-path-component')
);
