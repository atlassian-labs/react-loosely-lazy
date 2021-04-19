import { PRIORITY, SETTINGS } from '../../constants';
import { getAssetUrlsFromId } from '../../manifest';
import { PreloadPriority } from '../../types';
import { isNodeEnvironment } from '../../utils';

import { Loader } from '../loader';

import { insertLinkTag } from './utils';

declare const __webpack_require__: any;
declare function __webpack_get_script_filename__(chunkId: string): string;
type PreloadAssetOptions = { moduleId: string; rel: string };

const fakePromise = {
  then: () => fakePromise,
  catch: () => fakePromise,
  finally: () => fakePromise,
};

export function preloadAssetViaManifest(
  loader: Loader<unknown>,
  { moduleId, rel }: PreloadAssetOptions
) {
  const assets = getAssetUrlsFromId(SETTINGS.MANIFEST, moduleId);
  if (!assets) {
    return false;
  }

  assets.forEach(url => insertLinkTag(url, rel));

  return true;
}

export function preloadAssetViaWebpack(
  loader: Loader<unknown>,
  { rel }: PreloadAssetOptions
) {
  if (
    typeof __webpack_require__ === 'undefined' ||
    typeof __webpack_get_script_filename__ === 'undefined'
  )
    return false;

  // replace requireEnsure to create link tags instead of scripts
  const requireEnsure = __webpack_require__.e;
  __webpack_require__.e = function requirePreload(chunkId: string) {
    const href = __webpack_get_script_filename__(chunkId);
    insertLinkTag(href, rel);

    return fakePromise;
  };

  try {
    loader();
  } catch (err) {
    // ignore
  }
  // restore real webpack require ensure
  __webpack_require__.e = requireEnsure;

  return true;
}

export function preloadAssetViaLoader(loader: Loader<unknown>) {
  loader();

  return true;
}

export function preloadAsset(
  loader: Loader<unknown>,
  { moduleId, priority }: { moduleId: string; priority?: PreloadPriority }
) {
  if (isNodeEnvironment()) return;
  const rel = priority === PRIORITY.HIGH ? 'preload' : 'prefetch';
  [
    preloadAssetViaManifest,
    preloadAssetViaWebpack,
    preloadAssetViaLoader,
  ].some(strategy => strategy(loader, { moduleId, rel }));
}
