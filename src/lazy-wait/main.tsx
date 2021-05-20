import React, { useContext, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

import { PHASE } from '../constants';
import { LazyPhaseContext, createSubscribe } from '../phase';
import type { Listener } from '../phase';

export type LazyWaitProps = {
  until: boolean;
  children: ReactNode;
};

export const LazyWait = ({ until, children }: LazyWaitProps) => {
  const { api: ctxApi } = useContext(LazyPhaseContext);
  const phaseRef = useRef(-1);

  phaseRef.current = until ? PHASE.LAZY : -1;

  const { current: listeners } = useRef<Listener[]>([]);

  const api = useMemo(
    () => ({
      subscribe: createSubscribe(listeners),
      currentPhase: () => phaseRef.current,
      api: ctxApi,
    }),
    [listeners, ctxApi, phaseRef]
  );

  useEffect(() => {
    // Notify all children of phase change
    listeners.slice(0).forEach((listener: Listener) => {
      listener(phaseRef.current);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listeners, phaseRef.current]);

  return (
    <LazyPhaseContext.Provider value={api}>
      {children}
    </LazyPhaseContext.Provider>
  );
};
