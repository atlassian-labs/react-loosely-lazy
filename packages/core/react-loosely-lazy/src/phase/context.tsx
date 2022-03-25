import { createContext, useContext } from 'react';

import { PHASE } from '../constants';
import type { SubscriptionContextValue } from '../lazy/types';

import { LISTENERS } from './listeners';
import type { Listener } from './listeners';
import { createSubscribe } from './utils';

let CURRENT_PHASE = PHASE.PAINT;

export const setCurrent = (phase: number) => {
  CURRENT_PHASE = phase;
  LISTENERS.slice(0).forEach((listener: Listener) => listener(phase));
};

interface LazyPhaseContextApi extends SubscriptionContextValue {
  api: {
    startNextPhase: () => void;
    resetPhase: () => void;
  };
}

export const LazyPhaseContext = createContext<LazyPhaseContextApi>({
  subscribe: createSubscribe(LISTENERS),
  currentValue: () => CURRENT_PHASE,
  api: {
    startNextPhase: () => {
      setCurrent(PHASE.AFTER_PAINT);
    },
    resetPhase: () => setCurrent(PHASE.PAINT),
  },
});

export const useLazyPhase = () => {
  const v = useContext(LazyPhaseContext);

  return v.api;
};
