import React from 'react';
import { lazyAfterPaint } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Section } from '../common/section';

const props = {
  step: 'AFTER',
  title: 'After paint',
};

export const buildAfterPaintComponents = {
  server: () => {
    const WithSSR = lazyAfterPaint(() => require('./with-ssr'), {
      moduleId: './examples/playground/components/after-paint/with-ssr.tsx',
    });
    const WithoutSSR = lazyAfterPaint(() => import('./without-ssr'), {
      moduleId: './examples/playground/components/after-paint/without-ssr.tsx',
      ssr: false,
    });

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
  client: () => {
    const WithSSR = lazyAfterPaint(
      () => import('./with-ssr').then(controlLoad),
      { moduleId: './examples/playground/components/after-paint/with-ssr.tsx' }
    );
    const WithoutSSR = lazyAfterPaint(
      () => import('./without-ssr').then(controlLoad),
      {
        moduleId:
          './examples/playground/components/after-paint/without-ssr.tsx',
        ssr: false,
      }
    );

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
};
