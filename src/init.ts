import { SETTINGS, MODE, DEFAULT_SETTINGS } from './constants';
import { collect } from './collect';
import { Manifest } from './manifest';
import { LISTENERS, setCurrent } from './phase';
import { isNodeEnvironment } from './utils';

type InitOptions = {
  mode?: keyof typeof MODE;
  manifest?: Manifest;
  crossOrigin?: typeof SETTINGS.CROSS_ORIGIN;
};

export const LooselyLazy = {
  init: ({ mode, manifest, crossOrigin }: InitOptions) => {
    Object.assign(SETTINGS, DEFAULT_SETTINGS);

    if (mode != null) SETTINGS.CURRENT_MODE = mode;
    if (manifest != null) SETTINGS.MANIFEST = manifest;
    if (crossOrigin != null) SETTINGS.CROSS_ORIGIN = crossOrigin;

    LISTENERS.length = 0;
    setCurrent(0);

    if (!isNodeEnvironment()) {
      collect();
    }
  },
};
