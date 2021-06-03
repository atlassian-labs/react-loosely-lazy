import { ComponentProps, ComponentType, FunctionComponent } from 'react';

import { Cleanup } from '../cleanup';
import { PreloadPriority } from '../types';

export type LazyOptions = {
  /**
   * Whenever it should be required and rendered in SSR
   * If false it will just render the provided fallback
   */
  ssr?: boolean;
  /**
   * Id of `PHASE` responsible for start loading
   */
  defer?: number;
  /**
   * Id of the module being imported (normally its path).
   * It's calculated and provided by babel plugin
   */
  moduleId?: string;
};

export type LazyComponent<C extends ComponentType<any>> = FunctionComponent<
  ComponentProps<C>
> & {
  preload: (priority?: PreloadPriority) => Cleanup;
  getAssetUrls: () => string[] | undefined;
};
