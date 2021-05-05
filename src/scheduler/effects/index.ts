import { Cleanup } from '../../cleanup';

export type Effect<T> = () =>
  | Cleanup
  | {
      cleanup: Cleanup;
      source?: T;
    };

export const createEffects = () => {
  const cleanups: Cleanup[] = [];

  function runEffect<T>(effect: Effect<T>) {
    const maybeCleanup = effect();
    if (typeof maybeCleanup === 'function') {
      cleanups.push(maybeCleanup);

      return;
    }

    const { cleanup, source } = maybeCleanup;
    cleanups.push(cleanup);

    return source;
  }

  return {
    runEffect,
    cleanupEffects: () => {
      for (const cleanup of cleanups) {
        cleanup();
      }

      // Clear the stored cleanups, since we are done with them
      cleanups.length = 0;
    },
  };
};

export const createSleepEffect =
  (delay: number): Effect<Promise<void>> =>
  () => {
    let timeoutId: number;
    const source = new Promise<void>(resolve => {
      timeoutId = setTimeout(resolve, delay);
    });

    return {
      cleanup: () => {
        clearTimeout(timeoutId);
      },
      source,
    };
  };
