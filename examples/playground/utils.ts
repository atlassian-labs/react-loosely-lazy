import { listeners } from './constants';

export const isServer = () => window.name === 'nodejs';
export const isFailSsr = () => window.location.search.includes('failssr');
export const isRender = () =>
  isFailSsr() || window.location.search.includes('render');

export const controlLoad = <T>(result: T): Promise<T> => {
  let resolve: (v: T) => void;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add(step => {
    if (!step.includes('LOADING')) resolve(result);
  });

  return deferred;
};

const controlFetch = <T>(result: T): Promise<T> => {
  let resolve: (v: T) => void;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add(step => {
    if (!step.includes('FETCHING')) resolve(result);
  });

  return deferred;
};

export const createSuspendableData = () => {
  let promise: Promise<boolean> | null = null;
  let resolved = false;

  return function useSuspendableData() {
    if (promise == null && !isServer()) {
      promise = controlFetch(true);
    }

    if (promise && !resolved) {
      throw promise.then(() => {
        resolved = true;
      });
    }
  };
};
