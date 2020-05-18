import { ImportDefaultComponent, ClientLoader } from './loader';

export type Deferred = {
  promise: Promise<ImportDefaultComponent>;
  result: ImportDefaultComponent | void;
  start(): Promise<void>;
};

export const createDeferred = (loader: ClientLoader): Deferred => {
  let resolve: (m: any) => void;

  const deferred = {
    promise: new Promise<ImportDefaultComponent>(res => {
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
