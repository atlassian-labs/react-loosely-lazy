import { SETTINGS } from '../../constants';

export function insertLinkTag(href: string, rel: string) {
  // if already preloaded/prefetched/loaded, skip
  if (
    document.querySelector(`link[href="${href}"]`) ||
    document.querySelector(`script[src="${href}"]`)
  )
    return;

  const link = document.createElement('link');
  link.rel = rel;
  link.as = 'script';
  if (SETTINGS.CROSS_ORIGIN) link.crossOrigin = SETTINGS.CROSS_ORIGIN;
  link.href = href;
  document.head?.appendChild(link);
}
