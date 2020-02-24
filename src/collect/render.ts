export const cloneElements = (fromEl: any, id: string) => {
  const fragment = document.createElement('div');
  let el = fromEl;
  while ((el = el.nextSibling)) {
    if (el.dataset && el.dataset.lazyEnd === id) break;
    // cloneNode is 50% faster than outerHTML/textContent
    fragment.appendChild(el.cloneNode(true));
  }
  return Array.from(fragment.childNodes);
};
