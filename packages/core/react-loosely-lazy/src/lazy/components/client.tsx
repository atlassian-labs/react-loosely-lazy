import React, { lazy, useContext, useMemo, useState } from 'react';
import type { ComponentProps, ComponentType } from 'react';

import { getConfig, MODE } from '../../config';
import { COLLECTED, PHASE } from '../../constants';
import { WaitContext } from '../../lazy-wait';
import { LazyPhaseContext } from '../../phase';
import { LazySuspenseContext } from '../../suspense';

import { PRIORITY } from '../constants';
import { Deferred } from '../deferred';
import { createLoaderError } from '../errors';
import { PlaceholderFallbackRender } from '../placeholders/render';
import { PlaceholderFallbackHydrate } from '../placeholders/hydrate';
import { preloadAsset } from '../preload';
import { ProfilerContext } from '../../profiler';

import type { Status } from './types';
import { useSubscription } from './utils';

export function createComponentClient<C extends ComponentType<any>>({
  defer,
  deferred,
  dataLazyId,
  moduleId,
}: {
  defer: number;
  deferred: Deferred<C>;
  dataLazyId: string;
  moduleId: string;
}) {
  const { requestIdleCallback = setTimeout } = window;
  const ResolvedLazy = lazy(() => deferred.promise);

  return (props: ComponentProps<C>) => {
    // use a single piece of state to hold info about progress or eventually
    // throw an error. We do change it via direct mutation as re-renders
    // break Suspense in React 18, making it lose hydration state
    const [status, bubbleError] = useState<Status>(() => ({
      noWait: undefined,
      phase: defer === PHASE.AFTER_PAINT ? false : true,
      preloaded: defer === PHASE.AFTER_PAINT ? false : true,
      started: false,
    }));

    const profiler = useContext(ProfilerContext).current;

    const load = () => {
      if (status.started || !status.phase || !status.noWait) {
        return;
      }

      status.started = true;
      let onResolve;
      if (profiler) {
        const eventInfo = { identifier: moduleId };
        onResolve = () => {
          profiler.onLoadComplete(eventInfo);
        };
        profiler.onLoadStart(eventInfo);
      }

      const result = deferred.start().catch((err: Error) => {
        // Throw the error within the component lifecycle
        // refer to https://github.com/facebook/react/issues/11409
        bubbleError(() => {
          throw createLoaderError(err);
        });
      });

      if (onResolve) {
        result.then(onResolve);
      }
    };

    // Subscribe to LazyWait context, triggering load when until is true
    useSubscription({
      context: WaitContext,
      load,
      onValue: v => (status.noWait = v === 1),
    });

    if (defer === PHASE.AFTER_PAINT) {
      // Subscribe to LazyPhase context, triggering load when own phase starts
      useSubscription({
        context: LazyPhaseContext,
        load,
        onValue: v => (status.phase = v >= defer),
      });

      // Schedule preloading as will be needed soon
      useMemo(() => {
        if (!status.preloaded) {
          status.preloaded = true;
          requestIdleCallback(() => {
            if (status.started) return;
            preloadAsset({
              loader: deferred.preload,
              moduleId,
              priority: PRIORITY.LOW,
            });
          });
        }
      }, [status]);
    }

    const { setFallback } = useContext(LazySuspenseContext);

    useMemo(() => {
      // find SSR content (or fallbacks) wrapped in inputs based on lazyId
      const content = (COLLECTED.get(dataLazyId) || []).shift();
      if (!content) return;

      // override Suspense fallback with magic input wrappers
      const component =
        getConfig().mode === MODE.RENDER ? (
          <PlaceholderFallbackRender id={dataLazyId} content={content} />
        ) : (
          <PlaceholderFallbackHydrate id={dataLazyId} content={content} />
        );
      setFallback(component);
    }, [setFallback]);

    return <ResolvedLazy {...props} />;
  };
}
