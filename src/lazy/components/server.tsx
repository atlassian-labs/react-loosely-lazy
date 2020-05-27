import React, { useContext } from 'react';
import { LazySuspenseContext } from '../../suspense';
import { LoaderError } from '../errors/loader-error';
import { getExport } from '../../utils';
import { ServerLoader } from '../loader';

const load = (cacheId: string, loader: ServerLoader) => {
  try {
    return getExport(loader());
  } catch (err) {
    throw new LoaderError(cacheId, err);
  }
};

export const createComponentServer = ({
  cacheId,
  dataLazyId,
  loader,
  ssr,
}: {
  cacheId: string;
  dataLazyId: string;
  loader: ServerLoader;
  ssr: boolean;
}) => (props: any) => {
  const Resolved = ssr ? load(cacheId, loader) : null;
  const { fallback } = useContext(LazySuspenseContext);

  return (
    <>
      <input type="hidden" data-lazy-begin={dataLazyId} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={dataLazyId} />
    </>
  );
};
