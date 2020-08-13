import React, { memo } from 'react';
import { lazyForPaint, LazySuspense, LazyWait } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Result, Progress } from '../result';

const Async: any = {};

export const buildCustomWaitComponents = {
  server: () => {
    Async.ForPaintWithSSR = lazyForPaint(() => require('./with-ssr'), {
      moduleId: './custom-wait/with-ssr',
    });
    Async.ForPaintWithoutSSR = lazyForPaint(() => import('./without-ssr'), {
      moduleId: './custom-wait/without-ssr',
      ssr: false,
    });
  },
  client: () => {
    Async.ForPaintWithSSR = lazyForPaint(
      () => import('./with-ssr').then(controlLoad),
      { moduleId: './custom-wait/with-ssr' }
    );
    Async.ForPaintWithoutSSR = lazyForPaint(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './custom-wait/without-ssr', ssr: false }
    );
  },
};

export const CustomWaitComponents = memo(({ step }: { step: string }) => (
  <>
    <h3>
      <Progress step="CUSTOM" /> Custom wait components
    </h3>
    <LazyWait until={step.includes('CUSTOM')}>
      <LazySuspense fallback={<Result step="CUSTOM" isFallback hasSsr />}>
        <Async.ForPaintWithSSR />
      </LazySuspense>
      <LazySuspense fallback={<Result step="CUSTOM" isFallback />}>
        <Async.ForPaintWithoutSSR />
      </LazySuspense>
    </LazyWait>
  </>
));
