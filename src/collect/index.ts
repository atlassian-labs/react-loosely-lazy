import { MODE, COLLECTED, SETTINGS } from '../constants';
import { cloneElements } from './render';
import { refElements } from './hydrate';

export const collect = () => {
  const markers = document.querySelectorAll('input[data-lazy-begin]');
  for (let i = 0, j = markers.length; i < j; i += 1) {
    const el = markers[i] as any;
    const { lazyBegin } = el.dataset || {};
    const value =
      SETTINGS.CURRENT_MODE === MODE.RENDER
        ? cloneElements(markers[i], lazyBegin)
        : refElements(markers[i], lazyBegin);

    if (COLLECTED.has(lazyBegin)) {
      COLLECTED.get(lazyBegin).push(value);
    } else {
      COLLECTED.set(lazyBegin, [value]);
    }
  }
};
