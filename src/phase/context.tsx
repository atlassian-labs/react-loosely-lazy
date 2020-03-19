import { createContext, useContext } from 'react';

import { PHASE, PHASE_LAZY_DELAY } from '../constants';
import { createSubscribe } from './utils';

export const LISTENERS: any[] = [];
let CURRENT_PHASE = PHASE.PAINT;

export const setCurrent = (value: number) => {
  CURRENT_PHASE = value;
  LISTENERS.slice(0).forEach((listener: any) => listener(value));
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
