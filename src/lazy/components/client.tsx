import React, {
  ComponentProps,
  ComponentType,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getConfig } from '../../config';
import { PHASE, PRIORITY } from '../../constants';
import { useUntil } from '../../lazy-wait';
import { usePhaseSubscription } from '../../phase';
import { TASK_PRIORITY, useScheduler } from '../../scheduler';

import { Deferred } from '../deferred';
import { createLoaderError } from '../errors';
import { preloadAsset } from '../preload';

export function createComponentClient<C extends ComponentType<any>>({
  defer,
  deferred,
  moduleId,
  useFallback,
}: {
  defer: number;
  deferred: Deferred<C>;
  moduleId: string;
  useFallback: () => void;
}) {
  const ResolvedLazy = lazy(() => deferred.promise);

  return (props: ComponentProps<C>) => {
    const isMounted = useRef(true);

    useEffect(
      () => () => {
        isMounted.current = false;
      },
      []
    );

    const { autoStart } = getConfig();
    if (autoStart) {
      const { schedule } = useScheduler();
      const [unschedule, setState] = useState(() =>
        schedule({
          priority:
            defer === PHASE.AFTER_PAINT
              ? TASK_PRIORITY.NORMAL
              : TASK_PRIORITY.IMMEDIATE,
          task: () =>
            deferred.start().catch((err: Error) => {
              if (isMounted.current) {
                // Throw the error within the component lifecycle
                // refer to https://github.com/facebook/react/issues/11409
                setState(() => {
                  throw createLoaderError(err);
                });
              }
            }),
        })
      );

      useEffect(() => unschedule, [unschedule]);

      if (defer === PHASE.AFTER_PAINT) {
        useEffect(
          () =>
            preloadAsset({
              loader: deferred.preload,
              moduleId,
              priority: PRIORITY.LOW,
            }),
          []
        );
      }

      useFallback();

      return <ResolvedLazy {...props} />;
    }

    const started = useRef(false);
    const [, setState] = useState();
    const until = useUntil();

    const load = useRef(() => {
      if (started.current || !isMounted.current) {
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
        // Start preloading as it will be needed soon
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

    useFallback();

    return <ResolvedLazy {...props} />;
  };
}
