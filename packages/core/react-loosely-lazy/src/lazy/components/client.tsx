/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { getConfig, MODE } from '../../config';
import { COLLECTED, PHASE } from '../../constants';
import { WaitContext } from '../../lazy-wait';
import { LazySuspenseContext } from '../../suspense';
import { LazyPhaseContext } from '../../phase';

import { PRIORITY } from '../constants';
import { Deferred } from '../deferred';
import { createLoaderError } from '../errors';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { preloadAsset } from '../preload';
import { SubscriptionContextValue } from '../types';

type Status = {
  preload: boolean;
  phase: boolean;
  noWait: boolean;
  start: boolean;
};

type UseSubscriptionArgs<C> = {
  context: C;
  key: 'phase' | 'noWait';
  status: Status;
  load: () => void;
  comparator: (v: number) => boolean;
};

function useSubscription<C extends React.Context<SubscriptionContextValue>>({
  context,
  key,
  status,
  load,
  comparator,
}: UseSubscriptionArgs<C>) {
  const { subscribe, currentValue } = useContext(context);
  useMemo(() => {
    let unsubscribe: (() => void) | null = null;
    const check = () => {
      const done = comparator(currentValue());
      status[key] = done;
      if (done) load();
      if (done && unsubscribe) unsubscribe();

      return done;
    };

    unsubscribe = !check() ? subscribe(check) : null;
  }, []);
}

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
    const [status, bubbleError] = useState<Status>(() => ({
      preload: defer !== PHASE.AFTER_PAINT,
      phase: defer === PHASE.LAZY,
      noWait: true,
      start: false,
    }));

    const load = useCallback(() => {
      if (deferred.result || status.start || !status.phase || !status.noWait) {
        return;
      }

      status.start = true;
      deferred.start().catch((err: Error) => {
        // Throw the error within the component lifecycle
        // refer to https://github.com/facebook/react/issues/11409
        bubbleError(() => {
          throw createLoaderError(err);
        });
      });
    }, []);

    // Subscribe to LazyWait context, triggering load when until is true
    useSubscription({
      context: WaitContext,
      key: 'noWait',
      status,
      load,
      comparator: v => v === 1,
    });

    // Subscribe to LazyPhase context, triggering load when own phase starts
    useSubscription({
      // @ts-expect-error Context Provider shape confuses TS
      context: LazyPhaseContext,
      key: 'phase',
      status,
      load,
      comparator: v => v >= defer,
    });

    useMemo(() => {
      if (!status.preload) {
        status.preload = true;
        preloadAsset({
          loader: deferred.preload,
          moduleId,
          priority: PRIORITY.LOW,
        });
      }
    }, []);

    const { setFallback } = useContext(LazySuspenseContext);

    if (getConfig().mode === MODE.RENDER) {
      // Allow render mode to support partial progressive hydration
      useMemo(() => {
        // find SSR content (or fallbacks) wrapped in inputs based on lazyId
        const content = (COLLECTED.get(dataLazyId) || []).shift();
        if (!content || !ssr) return;

        // override Suspense fallback with magic input wrappers
        setFallback(
          <PlaceholderFallbackRender id={dataLazyId} content={content} />
        );
      }, [setFallback]);
    } else {
      // Allow hydration to support partials without server components
      useMemo(() => {
        // suspense will discard ssr during hydration if re-renders so we
        // set a dummy fallback to block updates from the provider until we resolve
        setFallback(deferred.result ? null : <></>);
      }, [setFallback]);
    }

    return <ResolvedLazy {...props} />;
  };
}
