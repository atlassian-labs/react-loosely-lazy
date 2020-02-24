export const refElements = (fromEl: any, id: string) => {
  const result = [];
  let el = fromEl;
  while ((el = el.nextSibling)) {
    if (el.dataset && el.dataset.lazyEnd === id) break;
    result.push(el);
  }
  return result;
};
