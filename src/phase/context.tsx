import { createContext } from 'react';
import { createSubscribe } from './utils';

const LISTENERS: any[] = [];
let CURRENT_PHASE = 0;

export const LazyPhaseContext = createContext({
  subscribe: createSubscribe(LISTENERS),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCurrent: (global?: boolean) => CURRENT_PHASE,
  setCurrent: (value: number) => {
    CURRENT_PHASE = value;
    LISTENERS.forEach((listener: any) => listener(value));
  },
});
