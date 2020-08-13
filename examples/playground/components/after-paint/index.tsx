import React, { memo } from 'react';
import { lazyAfterPaint, LazySuspense } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Result, Progress } from '../result';

const Async: any = {};

export const buildAfterPaintComponents = {
  server: () => {
    Async.AfterPaintWithSSR = lazyAfterPaint(() => require('./with-ssr'), {
      moduleId: './after-paint/with-ssr',
    });
    Async.AfterPaintWithoutSSR = lazyAfterPaint(() => import('./without-ssr'), {
      moduleId: './after-paint/without-ssr',
      ssr: false,
    });
  },
  client: () => {
    Async.AfterPaintWithSSR = lazyAfterPaint(
      () => import('./with-ssr').then(controlLoad),
      { moduleId: './after-paint/with-ssr' }
    );
    Async.AfterPaintWithoutSSR = lazyAfterPaint(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './after-paint/without-ssr', ssr: false }
    );
  },
};

export const AfterPaintComponents = memo(() => (
  <>
    <h3>
      <Progress step="AFTER" /> After paint components
    </h3>
    <LazySuspense fallback={<Result step="AFTER" isFallback hasSsr />}>
      <Async.AfterPaintWithSSR />
    </LazySuspense>
    <LazySuspense fallback={<Result step="AFTER" isFallback />}>
      <Async.AfterPaintWithoutSSR />
    </LazySuspense>
  </>
));
