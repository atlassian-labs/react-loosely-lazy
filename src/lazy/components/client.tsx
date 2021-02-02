import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { COLLECTED, SETTINGS, MODE, PHASE, PRIORITY } from '../../constants';
import { LazySuspenseContext } from '../../suspense';
import { usePhaseSubscription } from '../../phase';
import { Deferred } from '../deferred';
import { LoaderError } from '../errors/loader-error';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';
import { preloadAsset } from '../preload';

export function createComponentClient<C extends ComponentType<any>>({
  defer,
  deferred,
  dataLazyId,
  moduleId,
  ssr,
}: {
  defer: number;
  deferred: Deferred<C>;
  dataLazyId: string;
  moduleId: string;
  ssr: boolean;
}) {
  const ResolvedLazy = lazy(() => deferred.promise);

  return (props: ComponentProps<C>) => {
    const { setFallback } = useContext(LazySuspenseContext);
    const [componentState, setState] = useState();
    const isOwnPhase = usePhaseSubscription(defer);

    useMemo(() => {
      if (isOwnPhase) {
        if (
          (window as any).performance &&
          (window as any).performance.mark &&
          (window as any).isLoadingPhasesForRllMarksEnabled &&
          (window as any).isLoadingPhasesForRllMarksEnabled()
        ) {
          window.performance.mark(`RLL_Request[${moduleId}]`);
        }

        deferred
          .start()
          .then(() => {
            if (
              (window as any).performance &&
              (window as any).performance.mark &&
              (window as any).isLoadingPhasesForRllMarksEnabled &&
              (window as any).isLoadingPhasesForRllMarksEnabled()
            ) {
              window.performance.mark(`RLL_Resolved[${moduleId}]`);
            }
          })
          .catch((err: Error) => {
            // Throw the error within the component lifecycle
            // refer to https://github.com/facebook/react/issues/11409
            setState(() => {
              throw new LoaderError(moduleId, err);
            });
          });
      }
    }, [isOwnPhase]);

    useMemo(() => {
      // find SSR content (or fallbacks) wrapped in inputs based on lazyId
      const content = (COLLECTED.get(dataLazyId) || []).shift();
      if (!content) return;

      // override Suspense fallback with magic input wrappers
      const component =
        SETTINGS.CURRENT_MODE === MODE.RENDER ? (
          <PlaceholderFallbackRender id={dataLazyId} content={content} />
        ) : (
          <PlaceholderFallbackHydrate id={dataLazyId} content={content} />
        );
      setFallback(component);
    }, [setFallback]);

    if (!ssr) {
      // as the fallback is SSRd too, we want to discard it as soon as this
      // mounts (to avoid hydration warnings) and let Suspense render it
      useEffect(() => {
        setFallback(null);
      }, [setFallback]);
    }

    if (defer === PHASE.AFTER_PAINT) {
      // start preloading as will be needed soon
      useEffect(() => {
        if (!isOwnPhase) {
          preloadAsset(deferred.start, { moduleId, priority: PRIORITY.LOW });
        }
      }, [isOwnPhase]);
    }

    if (
      componentState &&
      (window as any).performance &&
      (window as any).performance.mark &&
      (window as any).isLoadingPhasesForRllMarksEnabled &&
      (window as any).isLoadingPhasesForRllMarksEnabled()
    ) {
      window.performance.mark(`RLL_Render[${moduleId}]`);
    }

    return <ResolvedLazy {...props} />;
  };
}
