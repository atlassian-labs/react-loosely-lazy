import React, { Fragment, createContext, SuspenseProps } from 'react';

export type Fallback = SuspenseProps['fallback'];

export type LazySuspenseContextType = {
  fallback: Fallback;
  setFallback(fallback: Fallback): void;
};

export const LazySuspenseContext = createContext<LazySuspenseContextType>({
  fallback: <Fragment />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setFallback: (fallback: Fallback) => {
    console.warn('Missing <LooselySuspense /> boundary');
  },
});
