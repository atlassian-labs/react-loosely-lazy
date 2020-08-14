export const listeners = new Set<(v: string) => void>();

export const steps = [
  'SSR',
  'PAINT LOADING',
  'PAINT FETCHING',
  'PAINT READY',
  'AFTER LOADING',
  'AFTER FETCHING',
  'AFTER READY', // also 'LAZY READY'
  'CUSTOM LOADING',
  'CUSTOM FETCHING',
  'CUSTOM READY',
];

export const pastSteps = new Set<string>();
