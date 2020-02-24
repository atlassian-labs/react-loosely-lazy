export const createSubscribe = (listeners: any[]) => (listener: any) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
};
