import React, { Fragment, createContext } from 'react';

export const LazySuspenseContext = createContext({
  fallback: <Fragment />,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setFallback: (f: any) => {
    console.warn('Missing <LooselySuspense /> boundary');
  },
});
