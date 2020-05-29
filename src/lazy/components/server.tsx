import React, { useContext } from 'react';
import { LazySuspenseContext } from '../../suspense';
import { LoaderError } from '../errors/loader-error';
import { getExport } from '../../utils';
import { ServerLoader } from '../loader';

const load = (moduleId: string, loader: ServerLoader) => {
  try {
    return getExport(loader());
  } catch (err) {
    throw new LoaderError(moduleId, err);
  }
};

export const createComponentServer = ({
  dataLazyId,
  loader,
  moduleId,
  ssr,
}: {
  dataLazyId: string;
  loader: ServerLoader;
  moduleId: string;
  ssr: boolean;
}) => (props: any) => {
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
