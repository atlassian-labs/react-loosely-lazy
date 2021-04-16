import { MODE, PRIORITY } from './constants';
import { Manifest } from './manifest';

export type PreloadPriority = typeof PRIORITY.HIGH | typeof PRIORITY.LOW;

export type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
  MANIFEST: Manifest;
  CROSS_ORIGIN: 'anonymous' | 'use-credentials' | undefined;
};
