import { getConfig } from '../../config';

export function insertLinkTag(href: string, rel: string) {
  // if already preloaded/prefetched/loaded, skip
  if (
    document.querySelector(`link[href="${href}"]`) ||
    document.querySelector(`script[src="${href}"]`)
  )
    return;

  const { crossOrigin } = getConfig();
  const link = document.createElement('link');

  link.rel = rel;
  link.as = 'script';
  if (crossOrigin) link.crossOrigin = crossOrigin;
  link.href = href;

  document.head?.appendChild(link);
}
