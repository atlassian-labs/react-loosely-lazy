import React, { Fragment, createContext } from 'react';
import { Fallback, LazySuspenseContextType } from './types';

export const LazySuspenseContext = createContext<LazySuspenseContextType>({
  fallback: <Fragment />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setFallback: (fallback: Fallback) => {
    console.warn('Missing <LooselySuspense /> boundary');
  },
});
