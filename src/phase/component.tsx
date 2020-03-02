import React, { useContext, useMemo, useRef } from 'react';

import { PHASE } from '../constants';
import { LazyPhaseContext } from './context';
import { createSubscribe } from './utils';

type LazyWaitProps = {
  until: boolean;
  children: any;
};
export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const { api: ctxApi } = useContext(LazyPhaseContext);
  const phaseRef = useRef(-1);
  phaseRef.current = until ? PHASE.INTERACTION : -1;

  // notify all children of phase change
  const { current: listeners } = useRef<any>([]);
  useMemo(() => {
    listeners.slice(0).forEach((listener: any) => listener(phaseRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeners, phaseRef.current]);

  const api = useMemo(
    () => ({
      subscribe: createSubscribe(listeners),
      currentPhase: () => phaseRef.current,
      api: ctxApi,
    }),
    [listeners, ctxApi, phaseRef]
  );

  return (
    <LazyPhaseContext.Provider value={api}>
      {children}
    </LazyPhaseContext.Provider>
  );
};
