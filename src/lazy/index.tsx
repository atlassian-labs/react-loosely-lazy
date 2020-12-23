import { ComponentProps, ComponentType, FunctionComponent } from 'react';

import { PHASE, SETTINGS } from '../constants';
import { hash, displayNameFromId, isNodeEnvironment } from '../utils';
import { Asset, Manifest } from '../webpack';

import { createComponentClient } from './components/client';
import { createComponentServer } from './components/server';
import { createDeferred } from './deferred';
import { ClientLoader, Loader, ServerLoader } from './loader';
import { LazyOptions, LazyComponent } from './types';
import { preloadAsset } from './utils';

export { Asset, Manifest, LazyOptions, LazyComponent };

function lazyProxy<C extends ComponentType<any>>(
  loader: Loader<C>,
  { defer = PHASE.PAINT, moduleId = '', ssr = true }: LazyOptions = {}
): LazyComponent<C> {
  const isServer = isNodeEnvironment();
  const dataLazyId = hash(moduleId);

  const LazyInternal: FunctionComponent<ComponentProps<C>> = isServer
    ? createComponentServer({
        dataLazyId,
        defer,
        loader: loader as ServerLoader<C>,
        moduleId,
        ssr,
      })
    : createComponentClient({
        dataLazyId,
        defer,
        deferred: createDeferred(loader as ClientLoader<C>),
        moduleId,
        ssr,
      });

  LazyInternal.displayName = `Lazy(${displayNameFromId(moduleId)})`;

  /**
   * Allows getting module chunks urls
   */
  const getAssetUrls = () => {
    if (!SETTINGS.MANIFEST[moduleId]) {
      return;
    }

    return SETTINGS.MANIFEST[moduleId];
  };

  /**
   * Allows imperatively preload the module chunk asset
   */
  const preload = () => {
    preloadAsset(loader);
  };

  return Object.assign(LazyInternal, {
    getAssetUrls,
    preload,
  });
}

export const DEFAULT_OPTIONS: {
  [key: string]: { ssr: boolean; defer: number };
} = {
  lazyForPaint: { ssr: true, defer: PHASE.PAINT },
  lazyAfterPaint: { ssr: true, defer: PHASE.AFTER_PAINT },
  lazy: { ssr: false, defer: PHASE.LAZY },
};

export function lazyForPaint<C extends ComponentType<any>>(
  loader: Loader<C>,
  opts?: LazyOptions
) {
  return lazyProxy<C>(loader, {
    ...DEFAULT_OPTIONS.lazyForPaint,
    ...(opts || {}),
  });
}

export function lazyAfterPaint<C extends ComponentType<any>>(
  loader: Loader<C>,
  opts?: LazyOptions
) {
  return lazyProxy<C>(loader, {
    ...DEFAULT_OPTIONS.lazyAfterPaint,
    ...(opts || {}),
  });
}

export function lazy<C extends ComponentType<any>>(
  loader: Loader<C>,
  opts?: LazyOptions
) {
  return lazyProxy<C>(loader, {
    ...DEFAULT_OPTIONS.lazy,
    ...(opts || {}),
  });
}

export { ClientLoader, Loader, ServerLoader };
export { LoaderError, isLoaderError } from './errors/loader-error';
