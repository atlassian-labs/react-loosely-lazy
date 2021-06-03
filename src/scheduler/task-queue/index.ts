import { Cleanup, noopCleanup } from '../../cleanup';
import { Priority, TASK_PRIORITY } from '../priority';

export type QueueTask = () => void;

const initTaskQueue = () => ({
  events: new EventTarget(),
  queue: new Set<QueueTask>(),
});

const taskQueues = new Map([
  [TASK_PRIORITY.IMMEDIATE, initTaskQueue()],
  [TASK_PRIORITY.NORMAL, initTaskQueue()],
]);

export type Listener = () => void;

export type TaskQueueEvent = 'empty';

export type TaskQueue = {
  add: (value: QueueTask) => void;
  delete: (value: QueueTask) => boolean;
  onEvent: (type: TaskQueueEvent, listener: Listener) => Cleanup;
  readonly size: number;
};

export const getTaskQueue = (priority: Priority): TaskQueue => {
  const { queue, events } = taskQueues.get(priority)!;

  return {
    add: (task: QueueTask) => {
      queue.add(task);
    },
    delete: (task: QueueTask) => {
      const deleted = queue.delete(task);

      if (queue.size === 0) {
        events.dispatchEvent(new CustomEvent('empty'));
      }

      return deleted;
    },
    onEvent: (type: TaskQueueEvent, listener: Listener) => {
      events.addEventListener(type, listener);

      return () => {
        events.removeEventListener(type, listener);
      };
    },
    get size() {
      return queue.size;
    },
  };
};

export const waitForEmptyQueue = (priority: Priority) => {
  const taskQueue = getTaskQueue(priority);
  if (taskQueue.size === 0) {
    return {
      cleanup: noopCleanup,
      source: Promise.resolve(),
    };
  }

  let resolve = () => {
    // noop...
  };

  const unlisten = taskQueue.onEvent('empty', () => {
    resolve();
  });

  return {
    cleanup: unlisten,
    source: new Promise<void>(res => {
      resolve = res;
    }),
  };
};
