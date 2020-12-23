import { Loader } from '../loader';

declare const __webpack_require__: any;
declare function __webpack_get_script_filename__(chunkId: string): string;
declare const __webpack_installed_chunks__: { [k: string]: number };

function requirePreload(chunkId: string) {
  const href = __webpack_get_script_filename__(chunkId);

  // If chunk already installed or preloaded
  if (
    __webpack_installed_chunks__[chunkId] === 0 ||
    document.head?.querySelector(`link[href="${href}"]`)
  )
    return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'script';
  link.href = href;
  document.head?.appendChild(link);
}

export function preloadAsset(loader: Loader<unknown>) {
  if (
    typeof __webpack_require__ === 'undefined' ||
    typeof __webpack_get_script_filename__ === 'undefined' ||
    typeof __webpack_installed_chunks__ === 'undefined' ||
    typeof document === 'undefined'
  )
    return;

  // replace requireEnsure to create link tags instead of scrips
  const requireEnsure = __webpack_require__.e;
  __webpack_require__.e = requirePreload;

  try {
    loader();
  } catch (err) {
    // ignore
  }
  // restore real webpack require ensure
  __webpack_require__.e = requireEnsure;
}
