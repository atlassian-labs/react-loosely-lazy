import React, { useContext, useState, useMemo, useEffect, useRef } from 'react';
import { DEFER } from '../constants';
import { LazyPhaseContext } from './context';
import { createSubscribe } from './utils';

export const usePhaseSubscription = (waitUntil = -1) => {
  const { subscribe, getCurrent } = useContext(LazyPhaseContext);
  const [run, setRun] = useState(() => getCurrent() >= waitUntil);

  // subscribe with memo instead of effect to retain tree order
  const unsubscribe = useMemo(
    () => subscribe((v: number) => setRun(v >= waitUntil)),
    [subscribe, setRun, waitUntil]
  );
  // subscription is done on first render, here just unsubscribe
  useEffect(() => {
    return unsubscribe;
  }, [unsubscribe]);

  return run;
};

type LazyWaitProps = {
  until: number | boolean;
  children: any;
};
export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const { getCurrent, setCurrent } = useContext(LazyPhaseContext);
  const waitUntil = typeof until === 'number' ? until : DEFER.PHASE_TRIGGER;
  const isOwnPhase = usePhaseSubscription(waitUntil);
  const phaseRef = useRef(0);
  phaseRef.current = isOwnPhase || until === true ? getCurrent(true) : -9;

  // notify all children of phase change
  const { current: listeners } = useRef<any>([]);
  useMemo(() => {
    listeners.slice(0).forEach((listener: any) => listener(phaseRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeners, phaseRef.current]);

  const api = useMemo(
    () => ({
      subscribe: createSubscribe(listeners),
      getCurrent: (global?: boolean) =>
        global ? getCurrent(global) : phaseRef.current,
      setCurrent,
    }),
    [getCurrent, listeners, setCurrent]
  );

  return (
    <LazyPhaseContext.Provider value={api}>
      {children}
    </LazyPhaseContext.Provider>
  );
};
