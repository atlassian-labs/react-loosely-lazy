import { useContext, useMemo } from 'react';
import type { Context } from 'react';

import type { SubscriptionContextValue } from '../types';

type UseSubscriptionArgs<C> = {
  context: Context<C>;
  load: () => void;
  onValue: (v: number) => boolean;
};

export function useSubscription<C extends SubscriptionContextValue>({
  context,
  load,
  onValue,
}: UseSubscriptionArgs<C>) {
  const { subscribe, currentValue } = useContext(context);
  useMemo(() => {
    let unsubscribe: (() => void) | null = null;
    const check = () => {
      const done = onValue(currentValue());
      if (done) load();
      if (done && unsubscribe) unsubscribe();

      return done;
    };

    unsubscribe = !check() ? subscribe(check) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
