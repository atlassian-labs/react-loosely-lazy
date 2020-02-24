import React, { useContext, useMemo } from 'react';
import { LazySuspenseContext } from '../../suspense';
import { LazyPhaseContext } from '../../phase';
import { tryRequire } from '../../utils';
import { COLLECTED, SETTINGS } from '../../constants';
import { MODE } from '../..';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';

export const createComponentClient = ({
  resolveId,
  defer,
  deferred,
  resolveHash,
}: any) => {
  const Resolved = tryRequire(resolveId);
  if (Resolved) deferred.resolve({ default: Resolved });
  const ResolvedLazy = React.lazy(() => deferred.promise);

  return (props: any) => {
    const { setFallback } = useContext(LazySuspenseContext);
    const { subscribe, getCurrent } = useContext(LazyPhaseContext);
    const isOwnPhase = getCurrent() >= defer;

    useMemo(() => {
      if (Resolved) return;
      if (isOwnPhase) {
        deferred.start().then(() => setFallback(null));
      } else {
        const unsubscribe = subscribe((v: number) => {
          if (v < defer) return;
          deferred.start().then(() => setFallback(null));
          unsubscribe();
        });
      }
    }, [isOwnPhase, setFallback, subscribe]);

    useMemo(() => {
      if (Resolved) return;
      const content = COLLECTED.get(resolveHash);
      if (content) {
        // override Suspense fallback with magic input
        const component =
          SETTINGS.CURRENT_MODE === MODE.RENDER ? (
            <PlaceholderFallbackRender id={resolveHash} content={content} />
          ) : (
            <PlaceholderFallbackHydrate id={resolveHash} content={content} />
          );
        setFallback(component);
        COLLECTED.delete(resolveHash);
      }
    }, [setFallback]);

    return <ResolvedLazy {...props} />;
  };
};
