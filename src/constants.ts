export const MODE = {
  RENDER: 'RENDER' as const,
  HYDRATE: 'HYDRATE' as const,
};

export const PHASE = {
  BOOTSTRAP: 0,
  DISPLAY: 1,
  INTERACTION: 2,
};

export const COLLECTED = new Map();

type Settings = {
  CURRENT_MODE: typeof MODE.HYDRATE | typeof MODE.RENDER;
  IS_SERVER: boolean;
};
export const SETTINGS: Settings = {
  CURRENT_MODE: MODE.HYDRATE,
  IS_SERVER: false,
};
