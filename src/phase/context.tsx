import { createContext, useContext } from 'react';
import { createSubscribe } from './utils';

export const LISTENERS: any[] = [];
let CURRENT_PHASE = 0;

export const setCurrent = (value: number) => {
  CURRENT_PHASE = value;
  LISTENERS.slice(0).forEach((listener: any) => listener(value));
};

export const LazyPhaseContext = createContext({
  subscribe: createSubscribe(LISTENERS),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrent: (global?: boolean) => CURRENT_PHASE,
  setCurrent,
});

export const useLazyPhase = () => useContext(LazyPhaseContext);
