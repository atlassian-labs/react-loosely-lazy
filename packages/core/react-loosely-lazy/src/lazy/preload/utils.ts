import { GlobalReactLooselyLazyProfiler } from '../../profiler';
import { noopCleanup } from '../../cleanup';
import { getConfig } from '../../config';

export function insertLinkTag(href: string, rel: string) {
  // Skip if already preloaded, prefetched, or loaded
  if (
    document.querySelector(`link[href="${href}"]`) ||
    document.querySelector(`script[src="${href}"]`)
  )
    return noopCleanup;

  const { crossOrigin } = getConfig();
  const link = document.createElement('link');

  link.rel = rel;
  link.as = 'script';
  if (crossOrigin) link.crossOrigin = crossOrigin;
  link.href = href;

  const profiler = GlobalReactLooselyLazyProfiler.current;
  let removableListener: (() => void) | null = null;
  if (profiler) {
    const eventInfo = { identifier: href };
    const listener = () => {
      link.removeEventListener('onload', listener);
      removableListener = null;
      profiler.onLoadComplete(eventInfo);
    };
    link.addEventListener('onload', listener);
    removableListener = listener;
    profiler.onLoadStart(eventInfo);
  }

  document.head?.appendChild(link);

  return () => {
    // Remove the link if it is still in the document head
    if (link.parentNode === document.head) {
      document.head?.removeChild(link);
    }
    if (removableListener) {
      link.removeEventListener('onload', removableListener);
    }
  };
}
