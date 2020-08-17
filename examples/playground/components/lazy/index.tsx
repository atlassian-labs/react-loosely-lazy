import React from 'react';
import { lazy } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Section } from '../common/section';

const props = {
  step: 'AF',
  title: 'Lazy',
};

export const buildLazyComponents = {
  server: () => {
    const WithoutSSR = lazy(() => import('./without-ssr'), {
      moduleId: './lazy/without-ssr',
      ssr: false,
    });

    return () => <Section components={{ WithoutSSR }} {...props} />;
  },
  client: () => {
    const WithoutSSR = lazy(() => import('./without-ssr').then(controlLoad), {
      moduleId: './lazy/without-ssr',
      ssr: false,
    });

    return () => <Section components={{ WithoutSSR }} {...props} />;
  },
};
