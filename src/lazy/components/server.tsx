import React, { useContext } from 'react';
import { tryRequire, getExport } from '../../utils';
import { LazySuspenseContext } from '../../suspense/context';

export const createComponentServer = ({
  ssr,
  loader,
  cacheId,
  dataLazyId,
}: any) => (props: any) => {
  const Resolved = ssr ? tryRequire(cacheId) || getExport(loader()) : null;
  const { fallback } = useContext(LazySuspenseContext);

  return (
    <>
      <input type="hidden" data-lazy-begin={dataLazyId} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={dataLazyId} />
    </>
  );
};
