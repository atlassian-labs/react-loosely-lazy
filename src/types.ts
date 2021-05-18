import { MODE, PRIORITY } from './constants';
import { Manifest } from './manifest';

export type PreloadPriority = typeof PRIORITY.HIGH | typeof PRIORITY.LOW;

export type Config = {
  crossOrigin: 'anonymous' | 'use-credentials' | undefined;
  manifest: Manifest;
  mode: typeof MODE.HYDRATE | typeof MODE.RENDER;
  retry: number;
};
