import { Listener } from './listeners';

export const createSubscribe = (listeners: Listener[]) => (
  listener: Listener
) => {
  listeners.push(listener);

  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
};
