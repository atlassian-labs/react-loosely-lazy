import React, { useContext } from 'react';
import { LazySuspenseContext } from '../../suspense';
import { tryRequire, getExport } from '../../utils';
import { LoaderError } from '../errors/loader-error';
import { ServerLoader } from '../loader';

const load = (cacheId: string, loader: ServerLoader) => {
  let result;
  try {
    result = loader();
  } catch (err) {
    throw new LoaderError(cacheId, err);
  }

  return getExport(result);
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
  const Resolved = ssr ? tryRequire(cacheId) || load(cacheId, loader) : null;
  const { fallback } = useContext(LazySuspenseContext);

  return (
    <>
      <input type="hidden" data-lazy-begin={dataLazyId} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={dataLazyId} />
    </>
  );
};
