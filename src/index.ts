export { MODE, SETTINGS } from './constants';
export type { Settings } from './constants';

export { LooselyLazy as default } from './init';

export {
  isLoaderError,
  lazyForPaint,
  lazyAfterPaint,
  lazy,
  LoaderError,
} from './lazy';

export type {
  ClientLoader,
  Loader,
  Options as LazyOptions,
  ServerLoader,
} from './lazy';

export { LazySuspense } from './suspense';
export type { Fallback, LazySuspenseProps } from './suspense';

export { LazyWait, useLazyPhase } from './phase';
export type { LazyWaitProps } from './phase';
