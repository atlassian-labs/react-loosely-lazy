import { SETTINGS } from './constants';
import { collect } from './collect';

export const LooselyLazy = {
  init: (mode: 'HYDRATE' | 'RENDER') => {
    SETTINGS.CURRENT_MODE = mode;

    if (!SETTINGS.IS_SERVER) {
      collect();
    }
  },
};
