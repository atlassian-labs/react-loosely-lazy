import React, { useContext } from 'react';
import type { ComponentProps, ComponentType } from 'react';

import { getConfig, MODE } from '../../config';
import { LazySuspenseContext } from '../../suspense';
import { getExport } from '../../utils';

import { createLoaderError } from '../errors';
import { ServerLoader } from '../loader';

function load<C>(moduleId: string, loader: ServerLoader<C>) {
  try {
    return getExport(loader());
  } catch (err) {
    throw createLoaderError(err);
  }
}

export function createComponentServer<C extends ComponentType<any>>({
  dataLazyId,
  defer,
  loader,
  moduleId,
  ssr,
}: {
  dataLazyId: string;
  defer: number;
  loader: ServerLoader<C>;
  moduleId: string;
  ssr: boolean;
}) {
  return (props: ComponentProps<C>) => {
    const Resolved = ssr ? load(moduleId, loader) : null;
    const { fallback } = useContext(LazySuspenseContext);
    const { mode } = getConfig();

    if (mode === MODE.RENDER) {
      return (
        <>
          <input type="hidden" data-lazy-begin={dataLazyId} />
          {Resolved ? <Resolved {...props} /> : fallback}
          <input type="hidden" data-lazy-end={dataLazyId} />
        </>
      );
    }

    return <>{Resolved ? <Resolved {...props} /> : fallback}</>;
  };
}
