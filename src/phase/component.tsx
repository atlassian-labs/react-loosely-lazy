import React, { ReactNode, useContext, useMemo, useRef } from 'react';

import { PHASE } from '../constants';
import { LazyPhaseContext } from './context';
import { Listener } from './listeners';
import { createSubscribe } from './utils';

export type LazyWaitProps = {
  until: boolean;
  children: ReactNode;
};

export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const { api: ctxApi } = useContext(LazyPhaseContext);
  const phaseRef = useRef(-1);

  phaseRef.current = until ? PHASE.LAZY : -1;

  // Notify all children of phase change
  const { current: listeners } = useRef<Listener[]>([]);

  useMemo(() => {
    listeners.slice(0).forEach((listener: Listener) => {
      listener(phaseRef.current);
    });
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
