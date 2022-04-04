import { createContext } from 'react';

import { noopCleanup } from '../cleanup';
import type { SubscriptionContextValue } from '../lazy/types';

export const WaitContext = createContext<SubscriptionContextValue>({
  subscribe: () => noopCleanup,
  currentValue: () => 1,
});
