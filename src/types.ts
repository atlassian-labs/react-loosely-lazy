import { MODE } from './constants';

export type Asset = string;

export type Manifest = { [key: string]: Asset[] };

export type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
  MANIFEST: Manifest;
};
