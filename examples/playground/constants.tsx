export const listeners = new Set<(v: string) => void>();

export const steps = [
  'SSR',
  'PAINT LOADING',
  'PAINT FETCHING',
  'PAINT READY',
  'AFTER LOADING',
  'AFTER FETCHING',
  'AFTER READY',
  'CUSTOM LOADING',
  'CUSTOM FETCHING',
  'CUSTOM READY',
];

export const pastSteps = new Set<string>();
