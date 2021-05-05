import { ComponentType } from 'react';
import { retry } from '@lifeomic/attempt';
import { getConfig } from '../config';
import { ClientLoader, JavaScriptModule } from './loader';

export type Deferred<C> = {
  promise: Promise<JavaScriptModule<C>>;
  result: JavaScriptModule<C> | void;
  preload(): void;
  start(): Promise<void>;
};

export const createDeferred = <C extends ComponentType<any>>(
  loader: ClientLoader<C>
): Deferred<C> => {
  const loaderWithRetry = () => {
    const { retry: retryCount } = getConfig();

    return retry(loader, {
      delay: 200,
      maxAttempts: retryCount + 1,
    });
  };

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

      loaderWithRetry().then((m: any) => {
        deferred.result = m;
      });
    },
    start: () => {
      if (deferred.result) {
        resolve(deferred.result);

        return deferred.promise.then(() => {
          // Return void...
        });
      } else {
        return loaderWithRetry().then(resolve);
      }
    },
  };

  return deferred;
};
