import { createContext } from 'react';
import type { MutableRefObject } from 'react';

import type { Cleanup } from '../cleanup';
import { noopCleanup } from '../cleanup';

export type UntilSubscriber = (until: boolean) => void;

export type UntilContextValue = {
  subscribe: (subscriber: UntilSubscriber) => Cleanup;
  value: MutableRefObject<boolean>;
};

export const UntilContext = createContext<UntilContextValue>({
  subscribe: () => noopCleanup,
  value: {
    current: true,
  },
});
