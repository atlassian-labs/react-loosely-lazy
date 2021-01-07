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
  // const ResolvedLazy = lazy(() => deferred.promise);

  return (props: ComponentProps<C>) => {
    const { setFallback } = useContext(LazySuspenseContext);
    const [component, setComponent] = useState();
    const isOwnPhase = usePhaseSubscription(defer);

    useMemo(() => {
      if (isOwnPhase) {
        console.log('deferred.start()', Date.now() - window.start);
        deferred.start().then(() => {
          setComponent(1);
        }).catch((err: Error) => {
          // Throw the error within the component lifecycle
          // refer to https://github.com/facebook/react/issues/11409
          setComponent(() => {
            throw new LoaderError(moduleId, err);
          });
        });
      } else {
        if (defer === PHASE.AFTER_PAINT) {
          preloadAsset(deferred.start, { moduleId, priority: PRIORITY.LOW });
        }
      }
    }, [isOwnPhase]);

    const fallback = useMemo(() => {
      // find SSR content (or fallbacks) wrapped in inputs based on lazyId
      const content = (COLLECTED.get(dataLazyId) || []).shift();
      if (!content) return;

      // override Suspense fallback with magic input wrappers
      const fallbackComponent =
        SETTINGS.CURRENT_MODE === MODE.RENDER ? (
          <PlaceholderFallbackRender id={dataLazyId} content={content} />
        ) : (
          <PlaceholderFallbackHydrate id={dataLazyId} content={content} />
        );
      console.log('returning lazy fallback', Date.now() - window.start);

      return fallbackComponent;
    }, []);

    if (!ssr) {
      // as the fallback is SSRd too, we want to discard it as soon as this
      // mounts (to avoid hydration warnings) and let Suspense render it
      useEffect(() => {
        setFallback(null);
      }, [setFallback]);
    }

    if (fallback && !component) {
      console.log('rendering lazy fallback', Date.now() - window.start);
      return fallback;
    }

    console.log('rendering lazy component', Date.now() - window.start);
    const Component = deferred.result.default || deferred.result;
    return <Component {...props} />;
  };
}
