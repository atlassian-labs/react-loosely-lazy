import React, { useContext, useMemo, useEffect } from 'react';

import { COLLECTED, SETTINGS, MODE } from '../../constants';
import { LazySuspenseContext } from '../../suspense';
import { usePhaseSubscription } from '../../phase';
import { tryRequire } from '../../utils';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';

export const createComponentClient = ({
  cacheId,
  defer,
  deferred,
  dataLazyId,
  ssr,
}: any) => {
  let isCached = Boolean(tryRequire(cacheId));

  if (!isCached) {
    deferred.promise.then(() => {
      isCached = true;
    });
  }

  const ResolvedLazy = React.lazy(() => deferred.promise);

  return (props: any) => {
    if (isCached) {
      return <ResolvedLazy {...props} />;
    }

    const { setFallback } = useContext(LazySuspenseContext);
    const isOwnPhase = usePhaseSubscription(defer);

    useMemo(() => {
      if (isOwnPhase) deferred.start().then(() => setFallback(null));
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
};
