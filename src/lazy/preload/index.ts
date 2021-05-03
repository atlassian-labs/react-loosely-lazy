import { getConfig } from '../../config';
import { PRIORITY } from '../../constants';
import { getAssetUrlsFromId } from '../../manifest';
import { PreloadPriority } from '../../types';
import { isNodeEnvironment } from '../../utils';

import { Loader } from '../loader';

import { insertLinkTag } from './utils';

declare const __webpack_require__: any;
declare function __webpack_get_script_filename__(chunkId: string): string;

type PreloadStrategyOptions = {
  loader: Loader<unknown>;
  moduleId: string;
  rel: string;
};

export type Cleanup = () => void;
export type PreloadStrategy = () => Cleanup;

export function createManifestPreloadStrategy({
  moduleId,
  rel,
}: Pick<PreloadStrategyOptions, 'moduleId' | 'rel'>): PreloadStrategy {
  const { manifest } = getConfig();
  const assets = getAssetUrlsFromId(manifest, moduleId);
  if (!assets) {
    throw new Error('Unsupported preload strategy');
  }

  return () => {
    const cleanupLinkTags = assets.map(url => insertLinkTag(url, rel));

    return () => {
      for (const cleanupLinkTag of cleanupLinkTags) {
        cleanupLinkTag();
      }
    };
  };
}

const fakePromise = {
  then: () => fakePromise,
  catch: () => fakePromise,
  finally: () => fakePromise,
};

export function createWebpackPreloadStrategy({
  loader,
  rel,
}: Pick<PreloadStrategyOptions, 'loader' | 'rel'>): PreloadStrategy {
  if (
    typeof __webpack_require__ === 'undefined' ||
    typeof __webpack_get_script_filename__ === 'undefined'
  )
    throw new Error('Unsupported preload strategy');

  return () => {
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
  };
}

export function createLoaderPreloadStrategy({
  loader,
}: Pick<PreloadStrategyOptions, 'loader'>): PreloadStrategy {
  return () => {
    loader();

    return () => {
      // Nothing to cleanup...
    };
  };
}

function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null;
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
  if (isNodeEnvironment())
    return () => {
      // Nothing to cleanup...
    };

  const rel = priority === PRIORITY.HIGH ? 'preload' : 'prefetch';
  const preloadStrategies = [
    createManifestPreloadStrategy,
    createWebpackPreloadStrategy,
    createLoaderPreloadStrategy,
  ]
    .map(strategyFactory => {
      try {
        return strategyFactory({ loader, moduleId, rel });
      } catch (_) {
        return;
      }
    })
    .filter(isPresent);

  const noopPreloadStrategy = () => () => {
    // Nothing to cleanup...
  };

  const preloadStrategy = preloadStrategies[0] ?? noopPreloadStrategy;
  const cleanupPreload = preloadStrategy();

  return () => {
    cleanupPreload();
  };
}
