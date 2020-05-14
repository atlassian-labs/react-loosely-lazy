import { createContext, useContext } from 'react';

import { PHASE, PHASE_LAZY_DELAY } from '../constants';
import { Listener, LISTENERS } from './listeners';
import { createSubscribe } from './utils';

let CURRENT_PHASE = PHASE.PAINT;

export const setCurrent = (phase: number) => {
  CURRENT_PHASE = phase;
  LISTENERS.slice(0).forEach((listener: Listener) => listener(phase));
};

export const LazyPhaseContext = createContext({
  subscribe: createSubscribe(LISTENERS),
  currentPhase: () => CURRENT_PHASE,
  api: {
    startNextPhase: () => {
      setCurrent(PHASE.AFTER_PAINT);
      setTimeout(() => setCurrent(PHASE.LAZY), PHASE_LAZY_DELAY);
    },
    resetPhase: () => setCurrent(PHASE.PAINT),
  },
});

export const useLazyPhase = () => {
  const v = useContext(LazyPhaseContext);

  return v.api;
};
