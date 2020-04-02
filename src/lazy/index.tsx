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

const lazyProxy = (
  loader: Loader,
  { ssr = true, defer = PHASE.PAINT, id = () => '' }: Options = {}
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

const DEFAULT_OPTIONS = {
  lazyForPaint: { ssr: true, defer: PHASE.PAINT },
  lazyAfterPaint: { ssr: true, defer: PHASE.AFTER_PAINT },
  lazy: { ssr: false, defer: PHASE.LAZY },
};

export const lazyForPaint = (loader: Loader, opts?: any) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazyForPaint,
    ...(opts || {}),
  });

export const lazyAfterPaint = (loader: Loader, opts?: any) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazyAfterPaint,
    ...(opts || {}),
  });

export const lazy = (loader: Loader, opts?: any) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazy,
    ...(opts || {}),
  });
