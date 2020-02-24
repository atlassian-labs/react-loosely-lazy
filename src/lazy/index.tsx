import React from 'react';
import { DEFER, SETTINGS } from '../constants';

import { hash, tryRequire, displayNameFromId } from '../utils';
import { createComponentServer } from './components/server';
import { createComponentClient } from './components/client';

type ImportDefaultComponent = {
  default: React.ComponentType<any>;
};
type Loader = () => Promise<ImportDefaultComponent>;

type Options = {
  // component name to help debug
  displayName?: string;

  // Should be rendered on SSR
  // if false renders fallback on SSR
  ssr?: boolean;

  defer?: number;

  id?: () => string;
};

const createDeferred = (loader: Loader) => {
  let resolve: any;
  const promise = new Promise<ImportDefaultComponent>(r => {
    resolve = r;
  });
  // TODO: handle error & reject
  const start = () => loader().then(resolve);
  return { promise, resolve, start };
};

export const lazy = (
  loader: Loader,
  {
    displayName,
    ssr = true,
    id = () => '',
    defer = DEFER.PHASE_IMMEDIATE,
  }: Options = {}
) => {
  const resolveId = id();
  const resolveHash = hash(resolveId);
  const deferred = createDeferred(loader);
  if (SETTINGS.IS_SERVER && ssr) deferred.start();

  const LazyComponent: any = SETTINGS.IS_SERVER
    ? createComponentServer({
        ssr,
        resolveId,
        resolveHash,
      })
    : createComponentClient({
        defer,
        deferred,
        resolveId,
        resolveHash,
      });

  LazyComponent.displayName = `Lazy(${displayName ||
    displayNameFromId(resolveId)})`;

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
