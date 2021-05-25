import React, { useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import { UntilContext } from './context';
import type { UntilSubscriber } from './context';

export type LazyWaitProps = {
  until: boolean;
  children: ReactNode;
};

export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const closestUntil = useContext(UntilContext);
  const value = useRef(until && closestUntil.value.current);
  const subscribers = useRef<Set<UntilSubscriber>>(new Set());
  const api = useRef({
    subscribe: (subscriber: UntilSubscriber) => {
      subscribers.current.add(subscriber);

      return () => {
        subscribers.current.delete(subscriber);
      };
    },
    value,
  });

  useEffect(() => {
    // Notify subscribers when until prop or closest until value changes
    const notify = (nextUntil: boolean) => {
      value.current = nextUntil && until;
      for (const subscriber of subscribers.current) {
        subscriber(value.current);
      }
    };

    notify(closestUntil.value.current);

    return closestUntil.subscribe(notify);
  }, [closestUntil, until]);

  return (
    <UntilContext.Provider value={api.current}>
      {children}
    </UntilContext.Provider>
  );
};
