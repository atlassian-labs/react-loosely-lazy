import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getConfig, MODE } from '../../config';
import { COLLECTED, PHASE } from '../../constants';
import { useUntil } from '../../lazy-wait';
import { LazySuspenseContext } from '../../suspense';
import { usePhaseSubscription } from '../../phase';

import { PRIORITY } from '../constants';
import { Deferred } from '../deferred';
import { createLoaderError } from '../errors';
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
    const started = useRef(false);
    const [, setState] = useState();
    const until = useUntil();

    const load = useRef(() => {
      if (started.current) {
        return;
      }

      started.current = true;
      deferred.start().catch((err: Error) => {
        // Throw the error within the component lifecycle
        // refer to https://github.com/facebook/react/issues/11409
        setState(() => {
          throw createLoaderError(err);
        });
      });
    });

    if (defer === PHASE.LAZY) {
      useEffect(() => {
        if (until) {
          load.current();
        }
      }, [until]);
    } else {
      const isOwnPhase = usePhaseSubscription(defer);

      useMemo(() => {
        if (isOwnPhase && until) {
          load.current();
        }
      }, [isOwnPhase, until]);

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
