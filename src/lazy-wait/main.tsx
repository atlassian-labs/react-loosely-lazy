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
  const untilProp = useRef(until);
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

  untilProp.current = until;

  useEffect(() => {
    // Notify subscribers when until prop changes
    value.current = closestUntil.value.current && until;
    for (const subscriber of subscribers.current) {
      subscriber(value.current);
    }
  }, [closestUntil, until]);

  useEffect(
    () =>
      // Subscribe to the closest subscribable, and when it updates notify all current subscribers
      closestUntil.subscribe(nextUntil => {
        value.current = nextUntil && untilProp.current;
        for (const subscriber of subscribers.current) {
          subscriber(value.current);
        }
      }),
    [closestUntil]
  );

  return (
    <UntilContext.Provider value={api.current}>
      {children}
    </UntilContext.Provider>
  );
};
