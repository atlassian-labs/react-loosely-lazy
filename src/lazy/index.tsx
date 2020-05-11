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

type Manifest = { [key: string]: Bundle };

type Bundle = {
  id: number | string | null;
  name: string | null;
  file: string;
  publicPath: string;
};

type Options = {
  // Should be rendered on SSR
  // if false renders fallback on SSR
  ssr?: boolean;

  defer?: number;

  getCacheId?: () => string;

  moduleId?: string;
};

type LazyComponent = React.ComponentType & {
  preload: () => void;
  getBundleUrl: (manifest: Manifest) => string | undefined;
};

const createDeferred = (loader: Loader) => {
  let resolve: any;
  let result: any;
  const deferred = {
    promise: new Promise<ImportDefaultComponent>(r => {
      resolve = (m: any) => {
        let withDefault;
        deferred.result = m;

        if (!m.default) {
          withDefault = { default: m };
        }

        r(withDefault ? withDefault : m);
      };
    }),
    result,
    start: () => loader().then(resolve),
  };

  return deferred;
};

const lazyProxy = (
  loader: Loader,
  {
    ssr = true,
    defer = PHASE.PAINT,
    getCacheId = () => '',
    moduleId = '',
  }: Options = {}
): LazyComponent => {
  const isServer = isNodeEnvironment();
  const cacheId = getCacheId();
  const dataLazyId = hash(moduleId);

  const LazyComponent: any = isServer
    ? createComponentServer({
        ssr,
        loader,
        cacheId,
        dataLazyId,
      })
    : createComponentClient({
        ssr,
        defer,
        deferred: createDeferred(loader),
        cacheId,
        dataLazyId,
      });

  LazyComponent.displayName = `Lazy(${displayNameFromId(moduleId)})`;

  /**
   * This will eventually be used to render preload link tags on transition.
   * Currently not working as we need a way for the client to be able to know the manifest[moduleId].file
   * without having to load the manifest on the client as it could be huge.
   */
  LazyComponent.preload = () => {
    if (tryRequire(cacheId)) {
      return;
    }

    const head = document.querySelector('head');

    if (!head) {
      return;
    }

    const link = document.createElement('link');

    link.rel = 'preload';

    // TODO add href to link
    head.appendChild(link);
  };

  LazyComponent.getBundleUrl = (manifest: Manifest) => {
    if (!manifest[moduleId]) {
      return undefined;
    }

    return manifest[moduleId].publicPath;
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
