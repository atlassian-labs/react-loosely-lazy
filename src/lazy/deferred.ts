import { ComponentType } from 'react';
import { ClientLoader, JavaScriptModule } from './loader';

export type CreateDeferredOptions<C> = {
  loader: ClientLoader<C>;
  preload: ClientLoader<C>;
};

export type Deferred<C> = {
  preload(): void;
  promise: Promise<JavaScriptModule<C>>;
  result: JavaScriptModule<C> | void;
  start(): Promise<void>;
};

export const createDeferred = <C extends ComponentType<any>>({
  loader,
  preload,
}: CreateDeferredOptions<C>): Deferred<C> => {
  let resolve: (m: any) => void;

  const deferred = {
    promise: new Promise<JavaScriptModule<C>>(res => {
      resolve = (m: any) => {
        let withDefault;
        deferred.result = m;

        if (!m.default) {
          withDefault = { default: m };
        }

        res(withDefault ? withDefault : m);
      };
    }),
    result: undefined,
    preload: () => {
      if (deferred.result) {
        return;
      }

      preload()
        .then((m: any) => {
          deferred.result = m;
        })
        .catch(() => {
          // Do nothing...
        });
    },
    start: () => {
      if (deferred.result) {
        resolve(deferred.result);

        return deferred.promise.then(() => {
          // Return void...
        });
      }

      // Make a new loader request when none have started or resolved yet
      return loader().then(resolve);
    },
  };

  return deferred;
};
