import { collect } from '../collect';
import { setConfig } from '../config';
import type { Config } from '../config';
import { LISTENERS, setCurrent } from '../phase';
import { isNodeEnvironment } from '../utils';

export type InitOptions = Partial<Config>;

export const LooselyLazy = {
  init: (config: InitOptions) => {
    setConfig(config);

    LISTENERS.length = 0;
    setCurrent(0);

    if (!isNodeEnvironment()) {
      collect();
    }
  },
};
