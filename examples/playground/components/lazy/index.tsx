import React from 'react';
import { lazy } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Section } from '../common/section';

const props = {
  step: 'PAINT',
  title: 'Lazy',
};

export const buildLazyComponents = {
  server: () => {
    const WithoutSSR = lazy(() => import('./without-ssr'), {
      moduleId: './examples/playground/components/lazy/without-ssr.tsx',
      ssr: false,
    });

    return () => <Section components={{ WithoutSSR }} {...props} />;
  },
  client: () => {
    const WithoutSSR = lazy(() => import('./without-ssr').then(controlLoad), {
      moduleId: './examples/playground/components/lazy/without-ssr.tsx',
      ssr: false,
    });
    // manual trigger preload
    WithoutSSR.preload();

    return () => <Section components={{ WithoutSSR }} {...props} />;
  },
};
