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
      moduleId: './for-paint/with-ssr',
    });
    const WithoutSSR = lazyForPaint(() => import('./without-ssr'), {
      moduleId: './for-paint/without-ssr',
      ssr: false,
    });

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
  client: () => {
    const WithSSR = lazyForPaint(() => import('./with-ssr').then(controlLoad), {
      moduleId: './for-paint/with-ssr',
    });
    const WithoutSSR = lazyForPaint(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './for-paint/without-ssr', ssr: false }
    );

    return () => <Section components={{ WithSSR, WithoutSSR }} {...props} />;
  },
};
