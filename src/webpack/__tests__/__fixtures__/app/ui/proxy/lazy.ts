import { lazyForPaint } from '../../lib/react-loosely-lazy';

export const LazyProxy = lazyForPaint(() =>
  import(/* webpackChunkName: "async-proxy" */ './index')
);
