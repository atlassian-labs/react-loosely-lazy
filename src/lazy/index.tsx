import React from 'react';

import { PHASE } from '../constants';
import { hash, displayNameFromId, isNodeEnvironment } from '../utils';
import type { Asset, Manifest } from '../webpack';

import { createComponentServer } from './components/server';
import { createComponentClient } from './components/client';
import { createDeferred } from './deferred';
import { ClientLoader, Loader, ServerLoader } from './loader';

export type { Asset, Manifest };

export type Options = {
  // Should be rendered on SSR
  // if false renders fallback on SSR
  ssr?: boolean;

  defer?: number;

  moduleId?: string;
};

type LazyComponent = React.ComponentType<any> & {
  preload: () => void;
  getAssetUrls: (manifest: Manifest) => string[] | undefined;
};

const lazyProxy = (
  loader: Loader,
  { defer = PHASE.PAINT, moduleId = '', ssr = true }: Options = {}
): LazyComponent => {
  const isServer = isNodeEnvironment();
  const dataLazyId = hash(moduleId);

  const LazyComponent: any = isServer
    ? createComponentServer({
        dataLazyId,
        loader: loader as ServerLoader,
        moduleId,
        ssr,
      })
    : createComponentClient({
        dataLazyId,
        defer,
        deferred: createDeferred(loader as ClientLoader),
        moduleId,
        ssr,
      });

  LazyComponent.displayName = `Lazy(${displayNameFromId(moduleId)})`;

  /**
   * This will eventually be used to render preload link tags on transition.
   * Currently not working as we need a way for the client to be able to know the manifest[moduleId].file
   * without having to load the manifest on the client as it could be huge.
   */
  LazyComponent.preload = () => {
    const head = document.querySelector('head');

    if (!head) {
      return;
    }

    const link = document.createElement('link');

    link.rel = 'preload';

    // TODO add href to link
    head.appendChild(link);
  };

  LazyComponent.getAssetUrls = (manifest: Manifest) => {
    if (!manifest[moduleId]) {
      return undefined;
    }

    return manifest[moduleId];
  };

  return LazyComponent;
};

export const DEFAULT_OPTIONS: {
  [key: string]: { ssr: boolean; defer: number };
} = {
  lazyForPaint: { ssr: true, defer: PHASE.PAINT },
  lazyAfterPaint: { ssr: true, defer: PHASE.AFTER_PAINT },
  lazy: { ssr: false, defer: PHASE.LAZY },
};

export const lazyForPaint = (loader: Loader, opts?: Options) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazyForPaint,
    ...(opts || {}),
  });

export const lazyAfterPaint = (loader: Loader, opts?: Options) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazyAfterPaint,
    ...(opts || {}),
  });

export const lazy = (loader: Loader, opts?: Options) =>
  lazyProxy(loader, {
    ...DEFAULT_OPTIONS.lazy,
    ...(opts || {}),
  });

export { ClientLoader, Loader, ServerLoader };
export { LoaderError, isLoaderError } from './errors/loader-error';
