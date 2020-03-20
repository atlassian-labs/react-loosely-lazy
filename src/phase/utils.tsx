export const createSubscribe = (listeners: any[]) => (listener: any) => {
  listeners.push(listener);

  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) listeners.splice(index, 1);
  };
};
