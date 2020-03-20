import React, { useContext } from 'react';
import { tryRequire, getExport } from '../../utils';
import { LazySuspenseContext } from '../../suspense/context';

export const createComponentServer = ({
  ssr,
  deferred,
  resolveId,
  resolveHash,
}: any) => (props: any) => {
  const Resolved = ssr
    ? tryRequire(resolveId) || getExport(deferred.result)
    : null;
  const { fallback } = useContext(LazySuspenseContext);

  return (
    <>
      <input type="hidden" data-lazy-begin={resolveHash} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={resolveHash} />
    </>
  );
};
