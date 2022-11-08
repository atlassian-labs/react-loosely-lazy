import { createContext } from 'react';

export type EventInfo = {
  identifier: string;
};

export type Profiler = {
  onLoadStart?(info: EventInfo): void;
  onLoadComplete?(info: EventInfo): void;
};

let globalInstance: Profiler | undefined;
export function setGlobalReactLooselyLazyProfilerInstance(instance: Profiler) {
  globalInstance = instance;
}

const globalInstanceProxy = {
  onLoadStart: (info: EventInfo) => globalInstance?.onLoadStart?.(info),
  onLoadComplete: (info: EventInfo) => globalInstance?.onLoadComplete?.(info),
};

export const GlobalReactLooselyLazyProfiler: Readonly<Profiler> =
  globalInstanceProxy;

export const ProfilerContext = createContext<Profiler>(globalInstanceProxy);
