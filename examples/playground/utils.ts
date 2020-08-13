export const listeners = new Set<Function>();

export const controlLoad = <T>(result: T): Promise<T> => {
  let resolve: Function;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add((step: string) => {
    if (!step.includes('LOADING')) resolve(result);
  });
  return deferred;
};

export const controlFetch = <T>(result: T): Promise<T> => {
  let resolve: Function;
  const deferred = new Promise<T>(r => {
    resolve = r;
  });
  listeners.add((step: string) => {
    if (!step.includes('FETCHING')) resolve(result);
  });
  return deferred;
};
