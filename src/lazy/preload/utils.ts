import { getConfig } from '../../config';

export function insertLinkTag(href: string, rel: string) {
  // Skip if already preloaded, prefetched, or loaded
  if (
    document.querySelector(`link[href="${href}"]`) ||
    document.querySelector(`script[src="${href}"]`)
  )
    return () => {
      // Nothing to cleanup...
    };

  const { crossOrigin } = getConfig();
  const link = document.createElement('link');

  link.rel = rel;
  link.as = 'script';
  if (crossOrigin) link.crossOrigin = crossOrigin;
  link.href = href;

  document.head?.appendChild(link);

  return () => {
    // Remove the child if it is still in the document head
    if (document.head?.contains(link)) {
      document.head?.removeChild(link);
    }
  };
}
