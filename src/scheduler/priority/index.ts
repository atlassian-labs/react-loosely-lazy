export const TASK_PRIORITY = {
  IMMEDIATE: 0,
  NORMAL: 1,
};

type ValueOf<T> = T[keyof T];

export type Priority = ValueOf<typeof TASK_PRIORITY>;
