export function insertLinkTag(href: string, rel: string) {
  // if already preloaded/prefetched/loaded, skip
  if (
    document.querySelector(`link[href="${href}"]`) ||
    document.querySelector(`script[src="${href}"]`)
  )
    return;

  const link = document.createElement('link');
  link.rel = rel;
  if (rel === 'preload') link.as = 'script';
  link.href = href;
  document.head?.appendChild(link);
}
