import { getConfig, MODE } from '../config';
import { COLLECTED } from '../constants';

import { cloneElements } from './render';
import { refElements } from './hydrate';

export const collect = () => {
  const markers = document.querySelectorAll<HTMLInputElement>(
    'input[data-lazy-begin]'
  );
  const { mode } = getConfig();
  for (let i = 0, j = markers.length; i < j; i += 1) {
    const el = markers[i];
    const { lazyBegin } = el.dataset || {};
    const value =
      mode === MODE.RENDER
        ? cloneElements(markers[i], lazyBegin)
        : refElements(markers[i], lazyBegin);

    if (COLLECTED.has(lazyBegin)) {
      COLLECTED.get(lazyBegin).push(value);
    } else {
      COLLECTED.set(lazyBegin, [value]);
    }
  }
};
