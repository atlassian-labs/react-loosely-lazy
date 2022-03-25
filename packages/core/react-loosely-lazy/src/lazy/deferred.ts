import { ComponentType } from 'react';
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
      // just load the code, without resolving
      loader();
    },
    start: () => {
      return loader().then(resolve);
    },
  };

  return deferred;
};
