import { MODE, PRIORITY } from './constants';

export type PreloadPriority = typeof PRIORITY.HIGH | typeof PRIORITY.LOW;

export type Asset = string;

export type Manifest = { [key: string]: Asset[] };

export type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
  MANIFEST: Manifest;
  CROSS_ORIGIN: 'anonymous' | 'use-credentials' | undefined;
};
