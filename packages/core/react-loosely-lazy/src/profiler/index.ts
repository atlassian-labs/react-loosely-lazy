import { createContext } from 'react';
import { PreloadPriority } from '../lazy/types';

export type EventInfo = {
  identifier: string;
};

type Profiler = {
  onPreload(moduleId: string, priority?: PreloadPriority): void;
  onLoadStart(info: EventInfo): void;
  onLoadComplete(info: EventInfo): void;
};

export type ProfilerContextType = {
  current: Profiler | null;
};

export const GlobalReactLooselyLazyProfiler: ProfilerContextType = {
  current: null,
};

export const ProfilerContext = createContext<ProfilerContextType>(
  GlobalReactLooselyLazyProfiler
);
