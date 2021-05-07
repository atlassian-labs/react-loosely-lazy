export const PACKAGE_NAME = 'react-loosely-lazy';

export const MODE = {
  RENDER: 'RENDER' as const,
  HYDRATE: 'HYDRATE' as const,
};

export const PHASE = {
  PAINT: 0,
  AFTER_PAINT: 1,
  LAZY: 2,
};

export const PRIORITY = {
  HIGH: 0,
  LOW: 2,
};

export const COLLECTED = new Map();

export const RETRY_DELAY = 300;
export const RETRY_FACTOR = 1;
