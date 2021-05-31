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

  document.head?.appendChild(link);

  return () => {
    // Remove the link if it is still in the document head
    if (link.parentNode === document.head) {
      document.head?.removeChild(link);
    }
  };
}
