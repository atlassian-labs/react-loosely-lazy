import { createContext, useContext } from 'react';

import { PHASE } from '../constants';
import { createSubscribe } from './utils';

export const LISTENERS: any[] = [];
let CURRENT_PHASE = PHASE.BOOTSTRAP;

export const setCurrent = (value: number) => {
  CURRENT_PHASE = value;
  LISTENERS.slice(0).forEach((listener: any) => listener(value));
};

export const LazyPhaseContext = createContext({
  subscribe: createSubscribe(LISTENERS),
  currentPhase: () => CURRENT_PHASE,
  api: {
    setPhaseDisplay: () => setCurrent(PHASE.DISPLAY),
    setPhaseInteraction: () => setCurrent(PHASE.INTERACTION),
    resetPhase: () => setCurrent(PHASE.BOOTSTRAP),
  },
});

export const useLazyPhase = () => {
  const v = useContext(LazyPhaseContext);
  return v.api;
};
