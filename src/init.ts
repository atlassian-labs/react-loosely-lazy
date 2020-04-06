import { SETTINGS } from './constants';
import { collect } from './collect';
import { LISTENERS, setCurrent } from './phase';
import { isNodeEnvironment } from './utils';

export const LooselyLazy = {
  init: (mode: 'HYDRATE' | 'RENDER') => {
    SETTINGS.CURRENT_MODE = mode;
    setCurrent(0);
    LISTENERS.length = 0;

    if (!isNodeEnvironment()) {
      collect();
    }
  },
};
