import React from 'react';
import { lazyForPaint, LazyWait } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Section } from '../common/section';

const props = {
  step: 'CUSTOM',
  title: 'Custom wait',
};

export const buildCustomWaitComponents = {
  server: () => {
    const WithSSR = lazyForPaint(() => require('./with-ssr'), {
      moduleId: './custom-wait/with-ssr',
    });
    const WithoutSSR = lazyForPaint(() => import('./without-ssr'), {
      moduleId: './custom-wait/without-ssr',
      ssr: false,
    });

    return ({ step }: { step: string }) => (
      <Section
        components={{ WithSSR, WithoutSSR, Wrapper: LazyWait }}
        currentStep={step}
        {...props}
      />
    );
  },
  client: () => {
    const WithSSR = lazyForPaint(() => import('./with-ssr').then(controlLoad), {
      moduleId: './custom-wait/with-ssr',
    });
    const WithoutSSR = lazyForPaint(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './custom-wait/without-ssr', ssr: false }
    );

    return ({ step }: { step: string }) => (
      <Section
        components={{ WithSSR, WithoutSSR, Wrapper: LazyWait }}
        currentStep={step}
        {...props}
      />
    );
  },
};
