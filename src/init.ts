import { SETTINGS, MODE } from './constants';
import { collect } from './collect';
import { LISTENERS, setCurrent } from './phase';
import { Manifest } from './types';
import { isNodeEnvironment } from './utils';

type InitOptions = {
  mode?: keyof typeof MODE;
  manifest?: Manifest;
};

export const LooselyLazy = {
  init: ({ mode = MODE.HYDRATE, manifest = {} }: InitOptions) => {
    SETTINGS.CURRENT_MODE = mode;
    SETTINGS.MANIFEST = manifest;
    LISTENERS.length = 0;
    setCurrent(0);

    if (!isNodeEnvironment()) {
      collect();
    }
  },
};
