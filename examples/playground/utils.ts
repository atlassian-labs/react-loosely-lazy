export const listeners = new Set<(v: string) => void>();

export const controlLoad = <T>(result: T): Promise<T> => {
  let resolve: (v?: T) => void;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add(step => {
    if (!step.includes('LOADING')) resolve(result);
  });

  return deferred;
};

export const controlFetch = <T>(result: T): Promise<T> => {
  let resolve: (v?: T) => void;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add(step => {
    if (!step.includes('FETCHING')) resolve(result);
  });

  return deferred;
};
