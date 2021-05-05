import { act } from '@testing-library/react-hooks';

import { DEFAULT_TASK_TIMEOUT } from '../constants';
import { TASK_PRIORITY } from '../index';

import {
  createDelayedTask,
  createResolvableTask,
  createSchedule,
  createSuccessfulTask,
  createUnsuccessfulTask,
  exhaustMicrotasks,
  tickBy,
} from './test-utils';

describe('useScheduler', () => {
  describe('schedule', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      // Flush any unfinished timers we do not care about before restoring the real timers
      jest.runAllTimers();
      jest.useRealTimers();
    });

    describe('runs an immediate task', () => {
      it('immediately when there are no other tasks scheduled', () => {
        const { schedule } = createSchedule();
        const immediateTask = createSuccessfulTask();

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask,
          });
        });

        expect(immediateTask).toHaveBeenCalledTimes(1);
      });

      it('immediately when an immediate task is already scheduled', () => {
        const { schedule } = createSchedule();
        const { onComplete: onImmediateTask1Complete, task: immediateTask1 } =
          createDelayedTask(1000);
        const immediateTask2 = createSuccessfulTask();

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask1,
          });
        });

        // Make sure the first immediate task is pending before scheduling the next immediate task
        expect(immediateTask1).toHaveBeenCalledTimes(1);
        expect(onImmediateTask1Complete).toHaveBeenCalledTimes(0);

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask2,
          });
        });

        expect(immediateTask2).toHaveBeenCalledTimes(1);
      });

      it('immediately when a normal task is already scheduled', async () => {
        const { schedule } = createSchedule();
        const immediateTask = createSuccessfulTask();
        const { onComplete: onNormalTaskComplete, task: normalTask } =
          createDelayedTask(1000);

        act(() => {
          schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // Make sure the normal task is pending before scheduling the immediate task
        await exhaustMicrotasks();
        expect(normalTask).toHaveBeenCalledTimes(1);
        expect(onNormalTaskComplete).toHaveBeenCalledTimes(0);

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask,
          });
        });

        // The immediate task should be scheduled on the initial tick
        expect(immediateTask).toHaveBeenCalledTimes(1);
      });
    });

    describe('runs a normal task (once)', () => {
      it('immediately when there are no other tasks scheduled', async () => {
        const { schedule } = createSchedule();
        const normalTask = createSuccessfulTask();

        act(() => {
          schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // The normal task is not scheduled on the initial tick
        expect(normalTask).toHaveBeenCalledTimes(0);

        await exhaustMicrotasks();

        // The normal task should be scheduled after all microtasks have run
        expect(normalTask).toHaveBeenCalledTimes(1);

        // Make sure the task only runs once after the timeout should occur
        await tickBy(DEFAULT_TASK_TIMEOUT);
        expect(normalTask).toHaveBeenCalledTimes(1);
      });

      it('after an immediate task has finished', async () => {
        const { schedule } = createSchedule();
        const delay = DEFAULT_TASK_TIMEOUT / 10;
        const { onComplete: onImmediateTaskComplete, task: immediateTask } =
          createDelayedTask(delay);
        const normalTask = createSuccessfulTask();

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask,
          });

          schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // Make sure the immediate task is pending before the specified delay
        await tickBy(delay - 1);
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(0);
        expect(normalTask).toHaveBeenCalledTimes(0);

        // Complete the immediate task, and make sure the normal task starts
        await tickBy(1);
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(1);
        expect(normalTask).toHaveBeenCalledTimes(1);

        // Make sure the task only runs once after the timeout should occur
        await tickBy(DEFAULT_TASK_TIMEOUT - delay);
        expect(normalTask).toHaveBeenCalledTimes(1);
      });

      it('after an immediate task is cancelled', async () => {
        const { schedule } = createSchedule();
        const { onComplete: onImmediateTaskComplete, task: immediateTask } =
          createDelayedTask(1000);
        const normalTask = createSuccessfulTask();

        let cancelImmediateTask: () => void;

        act(() => {
          cancelImmediateTask = schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask,
          });

          schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // Make sure the immediate task is pending, and that the normal task has not been executed
        expect(immediateTask).toHaveBeenCalledTimes(1);
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(0);
        expect(normalTask).toHaveBeenCalledTimes(0);

        act(() => {
          cancelImmediateTask();
        });

        // The normal task should have run after the immediate task is cancelled and all microtasks are exhausted
        expect(normalTask).toHaveBeenCalledTimes(0);
        await exhaustMicrotasks();
        expect(normalTask).toHaveBeenCalledTimes(1);

        // Make sure the task only runs once after the timeout should occur
        await tickBy(DEFAULT_TASK_TIMEOUT);
        expect(normalTask).toHaveBeenCalledTimes(1);
      });

      describe('when an immediate task is still pending', () => {
        type TestTimeoutOptions = {
          timeout: number | undefined;
        };

        const testTimeout = async ({ timeout }: TestTimeoutOptions) => {
          const { schedule } = createSchedule();
          const { resolve: resolveImmediateTask, task: immediateTask } =
            createResolvableTask();
          const normalTask = createSuccessfulTask();

          act(() => {
            schedule({
              priority: TASK_PRIORITY.IMMEDIATE,
              task: immediateTask,
            });

            schedule({
              priority: TASK_PRIORITY.NORMAL,
              task: normalTask,
              timeout,
            });
          });

          // Make sure the immediate task has started
          expect(immediateTask).toHaveBeenCalledTimes(1);

          // Make sure the normal task does not run before the timeout
          await tickBy((timeout ?? DEFAULT_TASK_TIMEOUT) - 1);
          expect(normalTask).toHaveBeenCalledTimes(0);

          // The normal task should run when the timeout occurs
          await tickBy(1);
          expect(normalTask).toHaveBeenCalledTimes(1);

          // Make sure the task only runs once, when the immediate queue is emptied
          act(() => {
            resolveImmediateTask();
          });

          await exhaustMicrotasks();
          expect(normalTask).toHaveBeenCalledTimes(1);
        };

        it('after the default maximum timeout', async () => {
          await testTimeout({
            timeout: undefined,
          });
        });

        it('after the specified maximum timeout', async () => {
          await testTimeout({
            timeout: DEFAULT_TASK_TIMEOUT / 2,
          });
        });
      });
    });

    describe('does not run a normal task', () => {
      it('once it has been cancelled before an immediate task resolves', async () => {
        const { schedule } = createSchedule();
        const delay = DEFAULT_TASK_TIMEOUT / 10;
        const { onComplete: onImmediateTaskComplete, task: immediateTask } =
          createDelayedTask(delay);
        const normalTask = createSuccessfulTask();

        let cancelNormalTask: () => void;

        act(() => {
          schedule({
            priority: TASK_PRIORITY.IMMEDIATE,
            task: immediateTask,
          });

          cancelNormalTask = schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // Make sure the immediate task is pending, and the normal task has not yet started
        expect(immediateTask).toHaveBeenCalledTimes(1);
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(0);
        expect(normalTask).toHaveBeenCalledTimes(0);

        act(() => {
          cancelNormalTask();
        });

        // Make sure the immediate task completed, and the normal task never started
        await tickBy(delay);
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(1);
        expect(normalTask).toHaveBeenCalledTimes(0);

        // Make sure the normal task does not run after the timeout should occur
        await tickBy(DEFAULT_TASK_TIMEOUT - delay);
        expect(normalTask).toHaveBeenCalledTimes(0);
      });

      it('once it has been cancelled in an empty queue', async () => {
        const { schedule } = createSchedule();
        const normalTask = createSuccessfulTask();

        let cancelNormalTask: () => void;

        act(() => {
          cancelNormalTask = schedule({
            priority: TASK_PRIORITY.NORMAL,
            task: normalTask,
          });
        });

        // Make sure the normal task has not been called yet
        expect(normalTask).toHaveBeenCalledTimes(0);

        act(() => {
          cancelNormalTask();
        });

        await exhaustMicrotasks();

        // The normal task should have been cancelled and not execute after exhausting all ticks
        expect(normalTask).toHaveBeenCalledTimes(0);

        // Make sure the task does not run after the timeout should occur
        await tickBy(DEFAULT_TASK_TIMEOUT);
        expect(normalTask).toHaveBeenCalledTimes(0);
      });
    });

    describe('does not throw an error', () => {
      it('when a scheduled immediate task fails', async () => {
        const { schedule } = createSchedule();
        const { onComplete: onImmediateTaskComplete, task: immediateTask } =
          createUnsuccessfulTask();

        act(() => {
          expect(() =>
            schedule({
              priority: TASK_PRIORITY.IMMEDIATE,
              task: immediateTask,
            })
          ).not.toThrow();
        });

        // Make sure there are no uncaught exceptions when the immediate task has completed
        await exhaustMicrotasks();
        expect(onImmediateTaskComplete).toHaveBeenCalledTimes(1);
      });

      it('when a scheduled normal task fails', async () => {
        const { schedule } = createSchedule();
        const { onComplete: onNormalTaskComplete, task: normalTask } =
          createUnsuccessfulTask();

        act(() => {
          expect(() =>
            schedule({
              priority: TASK_PRIORITY.NORMAL,
              task: normalTask,
            })
          ).not.toThrow();
        });

        // Make sure there are no uncaught exceptions when the normal task has completed
        await exhaustMicrotasks();
        expect(onNormalTaskComplete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
