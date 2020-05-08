import React, { useContext } from 'react';
import { tryRequire, getExport } from '../../utils';
import { LazySuspenseContext } from '../../suspense/context';

export const createComponentServer = ({
  ssr,
  deferred,
  cacheId,
  dataLazyId,
}: any) => (props: any) => {
  if (ssr) {
    deferred.start();
  }

  const Resolved = ssr
    ? tryRequire(cacheId) || getExport(deferred.result)
    : null;
  const { fallback } = useContext(LazySuspenseContext);

  return (
    <>
      <input type="hidden" data-lazy-begin={dataLazyId} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={dataLazyId} />
    </>
  );
};
