import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { COLLECTED, SETTINGS, MODE } from '../../constants';
import { LazySuspenseContext } from '../../suspense';
import { usePhaseSubscription } from '../../phase';
import { Deferred } from '../deferred';
import { LoaderError } from '../errors/loader-error';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';

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
    const isOwnPhase = usePhaseSubscription(defer);

    useMemo(() => {
      if (isOwnPhase)
        deferred
          .start()
          .then(() => setFallback(null))
          .catch((err: Error) => {
            // Throw the error within the component lifecycle -- refer to https://github.com/facebook/react/issues/11409
            setState(() => {
              throw new LoaderError(moduleId, err);
            });
          });
    }, [isOwnPhase, setFallback]);

    useMemo(() => {
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
      // if not SSR we can replace stale placeholder with suspense
      // as soon as the component mounts, so fallback becomes live
      // but we do not trigger hydration warnings
      useEffect(() => {
        setFallback(null);
      }, [setFallback]);
    }

    return <ResolvedLazy {...props} />;
  };
}
