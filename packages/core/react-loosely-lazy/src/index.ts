export { MODE } from './config';

export { LooselyLazy as default } from './init';
export type { InitOptions } from './init';

export {
  isLoaderError,
  lazyForPaint,
  lazyAfterPaint,
  lazy,
  PRIORITY,
} from './lazy';

export type {
  ClientLoader,
  LazyComponent,
  LazyOptions,
  Loader,
  ServerLoader,
} from './lazy';

export { LazyWait } from './lazy-wait';
export type { LazyWaitProps } from './lazy-wait';

export { LazySuspense } from './suspense';
export type { Fallback, LazySuspenseProps } from './suspense';

export { useLazyPhase } from './phase';

export { GlobalReactLooselyLazyProfiler, ProfilerContext } from './profiler';
