export const cloneElements = (
  fromEl: HTMLInputElement,
  id: string | undefined
) => {
  const fragment = document.createElement('div');
  let el: (ChildNode & { readonly dataset?: DOMStringMap }) | null = fromEl;
  while ((el = el.nextSibling)) {
    if (el.dataset && el.dataset.lazyEnd === id) break;
    // cloneNode is 50% faster than outerHTML/textContent
    fragment.appendChild(el.cloneNode(true));
  }

  return Array.from(fragment.childNodes);
};
