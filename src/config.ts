import { MODE } from './constants';
import { Config } from './types';

const DEFAULT_CROSS_ORIGIN = undefined;

const DEFAULT_MANIFEST = {
  publicPath: '/',
  assets: {},
};

const DEFAULT_MODE = MODE.HYDRATE;

const config: Config = {
  crossOrigin: DEFAULT_CROSS_ORIGIN,
  manifest: DEFAULT_MANIFEST,
  mode: DEFAULT_MODE,
};

export const getConfig = () => config;

export const setConfig = (nextConfig: Partial<Config>) => {
  config.crossOrigin = nextConfig.crossOrigin ?? DEFAULT_CROSS_ORIGIN;
  config.manifest = nextConfig.manifest ?? DEFAULT_MANIFEST;
  config.mode = nextConfig.mode ?? DEFAULT_MODE;
};
