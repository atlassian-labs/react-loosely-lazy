import { act, renderHook } from '@testing-library/react-hooks';
import { useScheduler } from '../main';

export const createSchedule = () => {
  const { result: scheduler, ...rest } = renderHook(() => useScheduler());

  return {
    ...rest,
    schedule: jest.fn(scheduler.current.schedule),
  };
};

export const createDelayedTask = (delay: number) => {
  const onComplete = jest.fn();
  const task = jest.fn(() =>
    new Promise(resolve => setTimeout(resolve, delay)).finally(onComplete)
  );

  return {
    onComplete,
    task,
  };
};

export const createResolvableTask = () => {
  let resolveTask = (): void => {
    throw new Error('Task resolver should be overridden');
  };

  const task = jest.fn(
    () =>
      new Promise<void>(resolve => {
        resolveTask = resolve;
      })
  );

  return {
    resolve: () => resolveTask(),
    task,
  };
};

export const createSuccessfulTask = () =>
  jest.fn(() => Promise.resolve('Success'));

export const createUnsuccessfulTask = () => {
  const error = new Error('An error occurred...');
  const onComplete = jest.fn();
  const task = jest.fn(() => Promise.reject(error).finally(onComplete));

  return {
    onComplete,
    task,
  };
};

export const exhaustMicrotasks = () =>
  act(async () => {
    await jest.runAllTicks();
  });

export const tickBy = (duration: number) =>
  act(async () => {
    await jest.advanceTimersByTime(duration);
  });
