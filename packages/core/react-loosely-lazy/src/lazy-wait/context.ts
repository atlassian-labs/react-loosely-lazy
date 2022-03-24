import { createContext } from 'react';

import type { SubscriptionContextValue } from '../lazy/types';
import { noopCleanup } from '../cleanup';

export const WaitContext = createContext<SubscriptionContextValue>({
  subscribe: () => noopCleanup,
  currentValue: () => 1,
});
