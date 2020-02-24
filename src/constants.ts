export const MODE = {
  RENDER: 'RENDER' as const,
  HYDRATE: 'HYDRATE' as const,
};

export const DEFER = {
  PHASE_IMMEDIATE: 0,
  PHASE_INTERACTIVE: 10,
  PHASE_IDLE: 20,
  PHASE_TRIGGER: 999,
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
