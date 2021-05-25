import type { Manifest } from 'react-loosely-lazy/manifest';

import { MODE } from './constants';

const DEFAULT_CROSS_ORIGIN = undefined;

const DEFAULT_MANIFEST = {
  publicPath: '/',
  assets: {},
};

const DEFAULT_MODE = MODE.HYDRATE;

const DEFAULT_RETRY = 2;

export type Config = {
  crossOrigin: 'anonymous' | 'use-credentials' | undefined;
  manifest: Manifest;
  mode: typeof MODE.HYDRATE | typeof MODE.RENDER;
  retry: number;
};

const config: Config = {
  crossOrigin: DEFAULT_CROSS_ORIGIN,
  manifest: DEFAULT_MANIFEST,
  mode: DEFAULT_MODE,
  retry: DEFAULT_RETRY,
};

export { MODE };

export const getConfig = () => config;

export const setConfig = (nextConfig: Partial<Config>) => {
  config.crossOrigin = nextConfig.crossOrigin ?? DEFAULT_CROSS_ORIGIN;
  config.manifest = nextConfig.manifest ?? DEFAULT_MANIFEST;
  config.mode = nextConfig.mode ?? DEFAULT_MODE;
  config.retry = nextConfig.retry ?? DEFAULT_RETRY;
};
