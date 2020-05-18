export const refElements = (
  fromEl: HTMLInputElement,
  id: string | undefined
) => {
  const result = [];
  let el: (ChildNode & { readonly dataset?: DOMStringMap }) | null = fromEl;
  while ((el = el.nextSibling)) {
    if (el.dataset && el.dataset.lazyEnd === id) break;
    result.push(el);
  }

  return result;
};
