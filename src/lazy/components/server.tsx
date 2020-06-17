import React, { useContext } from 'react';
import { LazySuspenseContext } from '../../suspense';
import { LoaderError } from '../errors/loader-error';
import { getExport } from '../../utils';
import { ServerLoader } from '../loader';

function load<P>(moduleId: string, loader: ServerLoader<P>) {
  try {
    return getExport(loader());
  } catch (err) {
    throw new LoaderError(moduleId, err);
  }
}

export function createComponentServer<P>({
  dataLazyId,
  loader,
  moduleId,
  ssr,
}: {
  dataLazyId: string;
  loader: ServerLoader<P>;
  moduleId: string;
  ssr: boolean;
}) {
  return (props: P) => {
    const Resolved = ssr ? load(moduleId, loader) : null;
    const { fallback } = useContext(LazySuspenseContext);

    return (
      <>
        <input type="hidden" data-lazy-begin={dataLazyId} />
        {Resolved ? <Resolved {...props} /> : fallback}
        <input type="hidden" data-lazy-end={dataLazyId} />
      </>
    );
  };
}
