import { ComponentProps, ComponentType, FunctionComponent } from 'react';

import { PHASE } from '../constants';
import { hash, displayNameFromId, isNodeEnvironment } from '../utils';
import { Asset, Manifest } from '../webpack';

import { createComponentClient } from './components/client';
import { createComponentServer } from './components/server';
import { createDeferred } from './deferred';
import { ClientLoader, Loader, ServerLoader } from './loader';
import { LazyOptions, LazyComponent } from './types';

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

  const getAssetUrls = (manifest: Manifest) => {
    if (!manifest[moduleId]) {
      return;
    }

    return manifest[moduleId];
  };

  /**
   * This will eventually be used to render preload link tags on transition.
   * Currently not working as we need a way for the client to be able to know the manifest[moduleId].file
   * without having to load the manifest on the client as it could be huge.
   */
  const preload = () => {
    const head = document.querySelector('head');

    if (!head) {
      return;
    }

    const link = document.createElement('link');

    link.rel = 'preload';

    // TODO add href to link
    head.appendChild(link);
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
