import React, { Fragment, createContext } from 'react';
import type { LazySuspenseContextType } from './types';

export const LazySuspenseContext = createContext<LazySuspenseContextType>({
  fallback: <Fragment />,
  setFallback: () => {
    console.warn('Missing <LooselySuspense /> boundary');
  },
});
