import { SuspenseProps } from 'react';

export type Fallback = SuspenseProps['fallback'];

export type LazySuspenseContextType = {
  fallback: Fallback;
  setFallback(fallback: Fallback): void;
};

export type LazySuspenseProps = {
  fallback: Fallback;
};
