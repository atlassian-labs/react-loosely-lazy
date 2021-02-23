export { MODE, SETTINGS, PRIORITY } from './constants';

export { LooselyLazy as default } from './init';

export {
  isLoaderError,
  lazyForPaint,
  lazyAfterPaint,
  lazy,
  LoaderError,
} from './lazy';

export type { ClientLoader, Loader, ServerLoader } from './lazy';
export type { LazyOptions, LazyComponent } from './lazy';

export { LazySuspense } from './suspense';
export type { Fallback, LazySuspenseProps } from './suspense';

export { LazyWait, useLazyPhase } from './phase';
export type { LazyWaitProps } from './phase';
export type { Settings } from './types';
