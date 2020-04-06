import { isNodeEnvironment } from './utils';

export const MODE = {
  RENDER: 'RENDER' as const,
  HYDRATE: 'HYDRATE' as const,
};

export const PHASE = {
  PAINT: 0,
  AFTER_PAINT: 1,
  LAZY: 2,
};

export const PHASE_LAZY_DELAY = 50;

export const COLLECTED = new Map();

type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
  IS_SERVER: boolean;
};

export const SETTINGS: Settings = {
  CURRENT_MODE: MODE.HYDRATE,
  IS_SERVER: isNodeEnvironment(),
};
