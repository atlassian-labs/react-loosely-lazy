import { MODE } from './constants';

export type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
};
