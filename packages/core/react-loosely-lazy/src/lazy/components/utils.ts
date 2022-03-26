import { useContext, useMemo } from 'react';
import type { Context } from 'react';

import type { SubscriptionContextValue } from '../types';
import type { Status } from './types';

type UseSubscriptionArgs<C> = {
  comparator: (v: number) => boolean;
  context: Context<C>;
  key: 'phase' | 'noWait';
  load: () => void;
  status: Status;
};

export function useSubscription<C extends SubscriptionContextValue>({
  comparator,
  context,
  key,
  load,
  status,
}: UseSubscriptionArgs<C>) {
  const { subscribe, currentValue } = useContext(context);
  useMemo(() => {
    let unsubscribe: (() => void) | null = null;
    const check = () => {
      const done = comparator(currentValue());
      status[key] = done;
      if (done) load();
      if (done && unsubscribe) unsubscribe();

      return done;
    };

    unsubscribe = !check() ? subscribe(check) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
