import type { ComponentType } from 'react';

export type ImportDefaultComponent<P> = {
  default: ComponentType<P>;
};

export type ClientLoader<P> = () => Promise<
  ImportDefaultComponent<P> | ComponentType<P>
>;

export type ServerLoader<P> = () =>
  | ImportDefaultComponent<P>
  | ComponentType<P>;

export type Loader<P> = ClientLoader<P> | ServerLoader<P>;
