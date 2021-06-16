export type Listener = (phase: number) => void;

export const LISTENERS: Listener[] = [];
