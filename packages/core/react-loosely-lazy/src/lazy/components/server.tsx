import { getAssetUrlsFromId } from '@react-loosely-lazy/manifest';
import React, { useContext } from 'react';
import type { ComponentProps, ComponentType } from 'react';

import { getConfig } from '../../config';
import { PHASE } from '../../constants';
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
    const { crossOrigin, manifest } = getConfig();

    return (
      <>
        <input type="hidden" data-lazy-begin={dataLazyId} />
        {defer !== PHASE.LAZY &&
          getAssetUrlsFromId(manifest, moduleId)?.map(url => (
            <link
              key={url}
              rel={defer === PHASE.PAINT ? 'preload' : 'prefetch'}
              href={url}
              crossOrigin={crossOrigin}
              as="script"
            />
          ))}
        {Resolved ? <Resolved {...props} /> : fallback}
        <input type="hidden" data-lazy-end={dataLazyId} />
      </>
    );
  };
}
