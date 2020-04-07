import React from 'react';
import { PHASE } from '../constants';

import {
  hash,
  tryRequire,
  displayNameFromId,
  isNodeEnvironment,
} from '../utils';
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

  cacheId?: () => string;

  moduleId?: string;
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
  {
    ssr = true,
    defer = PHASE.PAINT,
    cacheId = () => '',
    moduleId = '',
  }: Options = {}
) => {
  const isServer = isNodeEnvironment();
  const resolveId = cacheId();
  const resolveHash = hash(moduleId);
  const deferred = createDeferred(loader, isServer && ssr);

  const LazyComponent: any = isServer
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

export const DEFAULT_OPTIONS: {
  [key: string]: { ssr: boolean; defer: number };
} = {
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
