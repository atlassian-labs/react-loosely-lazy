import { useContext, useMemo, useState, useEffect } from 'react';

import { LazyPhaseContext } from './context';

// TODO This can be deleted once automatically starting phases becomes the default behaviour
export const usePhaseSubscription = (targetPhase = -1) => {
  const { subscribe, currentPhase } = useContext(LazyPhaseContext);
  const [run, setRun] = useState(() => currentPhase() >= targetPhase);

  // subscribe with memo instead of effect to retain tree order
  const unsubscribe = useMemo(
    () => subscribe((v: number) => setRun(v >= targetPhase)),
    [subscribe, setRun, targetPhase]
  );
  // subscription is done on first render, here just unsubscribe
  useEffect(() => {
    return unsubscribe;
  }, [unsubscribe]);

  return run;
};
