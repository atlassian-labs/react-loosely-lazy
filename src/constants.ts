import { Settings } from './types';

export const PACKAGE_NAME = 'react-loosely-lazy';

export const MODE = {
  RENDER: 'RENDER' as const,
  HYDRATE: 'HYDRATE' as const,
};

export const PHASE = {
  PAINT: 0,
  AFTER_PAINT: 1,
  LAZY: 2,
};

export const PRIORITY = {
  HIGH: 0,
  LOW: 2,
};

export const COLLECTED = new Map();

export const DEFAULT_SETTINGS: Settings = {
  CURRENT_MODE: MODE.HYDRATE,
  MANIFEST: {
    publicPath: '/',
    assets: {},
  },
  CROSS_ORIGIN: undefined,
};

export const SETTINGS: Settings = Object.assign({}, DEFAULT_SETTINGS);
