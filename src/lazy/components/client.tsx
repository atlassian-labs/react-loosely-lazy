import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { COLLECTED, MODE, PHASE, PRIORITY } from '../../constants';
import { LazySuspenseContext } from '../../suspense';
import { usePhaseSubscription } from '../../phase';
import { Deferred } from '../deferred';
import { createLoaderError } from '../errors';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';
import { preloadAsset } from '../preload';
import { getConfig } from '../../config';

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
    const [, setState] = useState();

    if (defer !== PHASE.LAZY) {
      const isOwnPhase = usePhaseSubscription(defer);

      useMemo(() => {
        if (isOwnPhase) {
          deferred.start().catch((err: Error) => {
            // Throw the error within the component lifecycle
            // refer to https://github.com/facebook/react/issues/11409
            setState(() => {
              throw createLoaderError(err);
            });
          });
        }
      }, [isOwnPhase]);

      if (defer === PHASE.AFTER_PAINT) {
        // Start preloading as will be needed soon
        useEffect(() => {
          if (!isOwnPhase) {
            return preloadAsset({
              loader: deferred.preload,
              moduleId,
              priority: PRIORITY.LOW,
            });
          }
        }, [isOwnPhase]);
      }
    } else {
      useEffect(() => {
        deferred.start().catch((err: Error) => {
          // Throw the error within the component lifecycle
          // refer to https://github.com/facebook/react/issues/11409
          setState(() => {
            throw createLoaderError(err);
          });
        });
      }, []);
    }

    useMemo(() => {
      // find SSR content (or fallbacks) wrapped in inputs based on lazyId
      const content = (COLLECTED.get(dataLazyId) || []).shift();
      if (!content) return;

      // override Suspense fallback with magic input wrappers
      const { mode } = getConfig();
      const component =
        mode === MODE.RENDER ? (
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

    return <ResolvedLazy {...props} />;
  };
}
