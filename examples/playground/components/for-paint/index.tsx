import React from 'react';
import { lazyForPaint } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Section } from '../common/section';

const props = {
  step: 'PAINT',
  title: 'For paint',
};

export const buildForPaintComponents = {
  server: () => {
    const WithSSR = lazyForPaint(() => require('./with-ssr'), {
      moduleId: './examples/playground/components/for-paint/with-ssr.tsx',
    });
    const WithoutSSR = lazyForPaint(() => import('./without-ssr'), {
      moduleId: './examples/playground/components/for-paint/without-ssr.tsx',
      ssr: false,
    });

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
  client: () => {
    const WithSSR = lazyForPaint(() => import('./with-ssr').then(controlLoad), {
      moduleId: './examples/playground/components/for-paint/with-ssr.tsx',
    });
    const WithoutSSR = lazyForPaint(
      () => import('./without-ssr').then(controlLoad),
      {
        moduleId: './examples/playground/components/for-paint/without-ssr.tsx',
        ssr: false,
      }
    );

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
};
