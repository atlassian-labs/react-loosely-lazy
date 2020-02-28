import React, { useContext, useMemo, useEffect } from 'react';
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
  ssr,
}: any) => {
  let isResolved = Boolean(tryRequire(resolveId));
  if (!isResolved) {
    deferred.promise.then((m: any) => {
      isResolved = m.default;
    });
  }
  const ResolvedLazy = React.lazy(() => deferred.promise);

  return (props: any) => {
    if (isResolved) return <ResolvedLazy {...props} />;

    const { setFallback } = useContext(LazySuspenseContext);
    const { subscribe, getCurrent } = useContext(LazyPhaseContext);
    const isOwnPhase = getCurrent() >= defer;

    useMemo(() => {
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
      const content = (COLLECTED.get(resolveHash) || []).shift();
      if (!content) return;
      // override Suspense fallback with magic input wrappers
      const component =
        SETTINGS.CURRENT_MODE === MODE.RENDER ? (
          <PlaceholderFallbackRender id={resolveHash} content={content} />
        ) : (
          <PlaceholderFallbackHydrate id={resolveHash} content={content} />
        );
      setFallback(component);
    }, [setFallback]);

    if (!ssr) {
      // if not SSR we can replace stale placeholder with suspense
      // as soon as the component mounts, so fallback becomes live
      // but we do not trigger hydration warnings
      useEffect(() => {
        setFallback(null);
      }, [setFallback]);
    }

    return <ResolvedLazy {...props} />;
  };
};
