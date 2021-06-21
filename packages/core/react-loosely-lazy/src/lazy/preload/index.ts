import { getAssetUrlsFromId } from '@react-loosely-lazy/manifest';

import { noopCleanup } from '../../cleanup';
import type { Cleanup } from '../../cleanup';
import { getConfig } from '../../config';
import { isNodeEnvironment } from '../../utils';

import { PRIORITY } from '../constants';
import { Loader } from '../loader';
import { PreloadPriority } from '../types';

import { insertLinkTag } from './utils';

declare const __webpack_require__: any;
declare function __webpack_get_script_filename__(chunkId: string): string;

export type { Cleanup };

type PreloadStrategyOptions = {
  loader: Loader<unknown>;
  moduleId: string;
  rel: string;
};

export function manifestPreloadStrategy({
  moduleId,
  rel,
}: Pick<PreloadStrategyOptions, 'moduleId' | 'rel'>): Cleanup {
  const { manifest } = getConfig();
  const assets = getAssetUrlsFromId(manifest, moduleId);
  if (!assets) {
    throw new Error('Unsupported preload strategy');
  }

  const cleanupLinkTags = assets.map(url => insertLinkTag(url, rel));

  return () => {
    for (const cleanupLinkTag of cleanupLinkTags) {
      cleanupLinkTag();
    }
  };
}

const fakePromise = {
  then: () => fakePromise,
  catch: () => fakePromise,
  finally: () => fakePromise,
};

export function webpackPreloadStrategy({
  loader,
  rel,
}: Pick<PreloadStrategyOptions, 'loader' | 'rel'>): Cleanup {
  if (
    typeof __webpack_require__ === 'undefined' ||
    typeof __webpack_get_script_filename__ === 'undefined'
  )
    throw new Error('Unsupported preload strategy');

  // Replace requireEnsure to create link tags instead of scripts
  const requireEnsure = __webpack_require__.e;
  const cleanupLinkTags: Cleanup[] = [];
  __webpack_require__.e = function requirePreload(chunkId: string) {
    const href = __webpack_get_script_filename__(chunkId);
    cleanupLinkTags.push(insertLinkTag(href, rel));

    return fakePromise;
  };

  try {
    loader();
  } catch (err) {
    // Ignore any errors
  }

  // Restore real webpack require ensure
  __webpack_require__.e = requireEnsure;

  return () => {
    for (const cleanupLinkTag of cleanupLinkTags) {
      cleanupLinkTag();
    }
  };
}

export function loaderPreloadStrategy({
  loader,
}: Pick<PreloadStrategyOptions, 'loader'>): Cleanup {
  loader();

  return noopCleanup;
}

export type PreloadAssetOptions = {
  loader: Loader<unknown>;
  moduleId: string;
  priority?: PreloadPriority;
};

export function preloadAsset({
  loader,
  moduleId,
  priority,
}: PreloadAssetOptions): Cleanup {
  if (isNodeEnvironment()) return noopCleanup;

  const rel = priority === PRIORITY.HIGH ? 'preload' : 'prefetch';
  const preloadStrategies = [
    manifestPreloadStrategy,
    webpackPreloadStrategy,
    loaderPreloadStrategy,
  ];

  for (const strategy of preloadStrategies) {
    try {
      return strategy({ loader, moduleId, rel });
    } catch (_) {
      // Try next strategy...
    }
  }

  return noopCleanup;
}
