import { ImportDefaultComponent, ClientLoader } from './loader';

export type Deferred<P> = {
  promise: Promise<ImportDefaultComponent<P>>;
  result: ImportDefaultComponent<P> | void;
  start(): Promise<void>;
};

export const createDeferred = <P>(loader: ClientLoader<P>): Deferred<P> => {
  let resolve: (m: any) => void;

  const deferred = {
    promise: new Promise<ImportDefaultComponent<P>>(res => {
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
    start: () => loader().then(resolve),
  };

  return deferred;
};
