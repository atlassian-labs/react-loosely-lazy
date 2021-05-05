import { Cleanup, noopCleanup } from '../cleanup';

import { DEFAULT_TASK_TIMEOUT } from './constants';
import { createEffects, createSleepEffect } from './effects';
import { Priority, TASK_PRIORITY } from './priority';
import { QueueTask, getTaskQueue, waitForEmptyQueue } from './task-queue';

type ScheduleTaskOptions = {
  priority: Priority;
  task: QueueTask;
  timeout: number;
};

const scheduleTask = ({
  priority,
  task: runTask,
  timeout,
}: ScheduleTaskOptions) => {
  if (priority === TASK_PRIORITY.IMMEDIATE) {
    runTask();

    return noopCleanup;
  }

  const { runEffect, cleanupEffects } = createEffects();
  const sleepEffect = runEffect(createSleepEffect(timeout));
  const waitForEffect = runEffect(() => waitForEmptyQueue(priority - 1));

  // A dispose check is needed for when any of the effects resolve immediately
  // TODO The AbortController, or other cancellation techniques, should be used here when they become more standardised
  let disposed = false;

  Promise.race([sleepEffect, waitForEffect])
    .then(() => {
      if (!disposed) {
        runTask();
      }
    })
    // When one strategy wins, cleanup the other by cleaning up all of the effects.
    //
    // This will execute earlier than the task completion cleanup, but does not affect any resulting behaviour since
    // Promise.race will only resolve once.
    .finally(cleanupEffects);

  // Return a cleanup function that allows the scheduled task to be cancelled manually
  return () => {
    disposed = true;
    cleanupEffects();
  };
};

export type ScheduleOptions = {
  priority: Priority;
  task: () => Promise<unknown>;
  timeout?: number;
};

export type { Cleanup };

const schedule = ({
  priority,
  task,
  timeout = DEFAULT_TASK_TIMEOUT,
}: ScheduleOptions): Cleanup => {
  const taskQueue = getTaskQueue(priority);
  const { runEffect, cleanupEffects } = createEffects();

  let pending = false;
  const runnableTask = () => {
    if (pending) {
      return;
    }

    pending = true;
    task()
      .catch(() => {
        // Do nothing...
      })
      .finally(() => {
        pending = false;
        // When we are done with the task, cleanup everything
        cleanupEffects();
      });
  };

  runEffect(() => {
    // Add the task to the queue, then schedule it
    taskQueue.add(runnableTask);
    const cancel = scheduleTask({
      priority,
      task: runnableTask,
      timeout,
    });

    return () => {
      taskQueue.delete(runnableTask);
      cancel();
    };
  });

  // Return a cleanup function that allows the scheduled task to be cancelled manually
  return cleanupEffects;
};

export type Scheduler = {
  schedule: typeof schedule;
};

export const useScheduler = (): Scheduler => ({
  schedule,
});
