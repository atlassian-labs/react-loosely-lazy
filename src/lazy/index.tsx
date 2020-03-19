import React from 'react';
import { PHASE, SETTINGS } from '../constants';

import { hash, tryRequire, displayNameFromId } from '../utils';
import { createComponentServer } from './components/server';
import { createComponentClient } from './components/client';

type ImportDefaultComponent = {
  default: React.ComponentType<any>;
};
type Loader = () => Promise<ImportDefaultComponent>;

type Options = {
  // Should be rendered on SSR
  // if false renders fallback on SSR
  ssr?: boolean;

  defer?: number;

  id?: () => string;
};

const createDeferred = (loader: Loader, sync: boolean) => {
  let resolve: any;
  let result: any;
  const promise = new Promise<ImportDefaultComponent>(r => {
    resolve = (m: any) => {
      result = m;
      r(m);
    };
  });
  // TODO: handle error & reject
  const start = () => loader().then(resolve);
  if (sync) start();

  return { promise, result, start };
};

const lazy = (
  loader: Loader,
  { ssr = true, defer = PHASE.CRITICAL, id = () => '' }: Options = {}
) => {
  const resolveId = id();
  const resolveHash = hash(resolveId);
  const deferred = createDeferred(loader, SETTINGS.IS_SERVER && ssr);

  const LazyComponent: any = SETTINGS.IS_SERVER
    ? createComponentServer({
        ssr,
        deferred,
        resolveId,
        resolveHash,
      })
    : createComponentClient({
        ssr,
        defer,
        deferred,
        resolveId,
        resolveHash,
      });

  LazyComponent.displayName = `Lazy(${displayNameFromId(resolveId)})`;

  LazyComponent.prefetch = () => {
    if (tryRequire(resolveId)) return;
    const head = document.querySelector('head');
    if (!head) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    // TODO find out href or call
    head.appendChild(link);
  };

  LazyComponent.Prefetch = () => <link rel="prefetch" href="** TODO **" />;

  return LazyComponent;
};

export const lazyForCritical = lazy;

export const lazyAfterCritical = (loader: Loader, opts?: any) =>
  lazy(loader, {
    ssr: true,
    defer: PHASE.AFTER_CRITICAL,
    ...(opts || {}),
  });

export const lazyOnDemand = (loader: Loader, opts?: any) =>
  lazy(loader, {
    ssr: false,
    defer: PHASE.ON_DEMAND,
    ...(opts || {}),
  });
