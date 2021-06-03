import { MODE } from './constants';
import { Config } from './types';

const DEFAULT_AUTO_START = false;

const DEFAULT_CROSS_ORIGIN = undefined;

const DEFAULT_MANIFEST = {
  publicPath: '/',
  assets: {},
};

const DEFAULT_MODE = MODE.HYDRATE;

const DEFAULT_RETRY = 2;

const config: Config = {
  autoStart: DEFAULT_AUTO_START,
  crossOrigin: DEFAULT_CROSS_ORIGIN,
  manifest: DEFAULT_MANIFEST,
  mode: DEFAULT_MODE,
  retry: DEFAULT_RETRY,
};

export const getConfig = () => config;

export const setConfig = (nextConfig: Partial<Config>) => {
  config.autoStart = nextConfig.autoStart ?? DEFAULT_AUTO_START;
  config.crossOrigin = nextConfig.crossOrigin ?? DEFAULT_CROSS_ORIGIN;
  config.manifest = nextConfig.manifest ?? DEFAULT_MANIFEST;
  config.mode = nextConfig.mode ?? DEFAULT_MODE;
  config.retry = nextConfig.retry ?? DEFAULT_RETRY;
};
