export type Cleanup = () => void;

export const noopCleanup = () => {
  // Nothing to cleanup...
};
