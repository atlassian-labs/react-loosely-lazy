import React, { useContext, useEffect, useMemo } from 'react';
import { getConfig } from '../../config';
import { COLLECTED, MODE } from '../../constants';
import { LazySuspenseContext } from '../../suspense';

import { PlaceholderFallbackHydrate } from './hydrate';
import { PlaceholderFallbackRender } from './render';

export type UseFallbackOptions = {
  id: string;
  ssr: boolean;
};

export const useFallback = ({ id, ssr }: UseFallbackOptions) => {
  const { setFallback } = useContext(LazySuspenseContext);

  useMemo(() => {
    // Find SSR content (or fallbacks) wrapped in inputs based on the id
    const content = (COLLECTED.get(id) || []).shift();
    if (!content) return;

    // Override Suspense fallback with magic input wrappers
    const { mode } = getConfig();
    const component =
      mode === MODE.RENDER ? (
        <PlaceholderFallbackRender id={id} content={content} />
      ) : (
        <PlaceholderFallbackHydrate id={id} content={content} />
      );
    setFallback(component);
  }, [id, setFallback]);

  // As the fallback is SSRd too, we want to discard it as soon as this
  // mounts (to avoid hydration warnings) and let Suspense render it
  useEffect(() => {
    if (!ssr) {
      setFallback(null);
    }
  }, [setFallback, ssr]);
};
