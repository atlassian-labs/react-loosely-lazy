import React, { useContext, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

import type { SubscriptionContextValue } from '../lazy/types';

import { WaitContext } from './context';

export type LazyWaitProps = {
  until: boolean;
  children: ReactNode;
};

export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const closestWait = useContext(WaitContext);
  const value = useRef(until && closestWait.currentValue() ? 1 : 0);
  const subscribers = useRef<Set<() => void>>(new Set());
  const api = useRef<SubscriptionContextValue>({
    subscribe: subscriber => {
      subscribers.current.add(subscriber);

      return () => {
        subscribers.current.delete(subscriber);
      };
    },
    currentValue: () => value.current,
  });

  useEffect(() => {
    // Notify subscribers when until prop or closest until value changes
    const notify = () => {
      value.current = closestWait.currentValue() && until ? 1 : 0;
      subscribers.current.forEach(subscriber => subscriber());
    };

    notify();

    return closestWait.subscribe(notify);
  }, [closestWait, until]);

  return (
    <WaitContext.Provider value={api.current}>{children}</WaitContext.Provider>
  );
};
