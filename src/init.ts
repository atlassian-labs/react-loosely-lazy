import { collect } from './collect';
import { setConfig } from './config';
import { LISTENERS, setCurrent } from './phase';
import { isNodeEnvironment } from './utils';
import { Config } from './types';

type InitOptions = Partial<Config>;

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
