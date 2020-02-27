import React, { useContext } from 'react';
import { tryRequire } from '../../utils';
import { LazySuspenseContext } from '../../suspense/context';

export const createComponentServer = ({ ssr, resolveId, resolveHash }: any) => (
  props: any
) => {
  const Resolved = ssr ? tryRequire(resolveId) : null;
  const { fallback } = useContext(LazySuspenseContext);
  return (
    <>
      <input type="hidden" data-lazy-begin={resolveHash} />
      {Resolved ? <Resolved {...props} /> : fallback}
      <input type="hidden" data-lazy-end={resolveHash} />
    </>
  );
};
