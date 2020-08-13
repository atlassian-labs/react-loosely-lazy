import React, { memo } from 'react';
import { lazyForPaint, LazySuspense } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Result, Progress } from '../result';

const Async: any = {};

export const buildForPaintComponents = {
  server: () => {
    Async.ForPaintWithSSR = lazyForPaint(() => require('./with-ssr'), {
      moduleId: './for-paint/with-ssr',
    });
    Async.ForPaintWithoutSSR = lazyForPaint(() => import('./without-ssr'), {
      moduleId: './for-paint/without-ssr',
      ssr: false,
    });
  },
  client: () => {
    Async.ForPaintWithSSR = lazyForPaint(
      () => import('./with-ssr').then(controlLoad),
      { moduleId: './for-paint/with-ssr' }
    );
    Async.ForPaintWithoutSSR = lazyForPaint(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './for-paint/without-ssr', ssr: false }
    );
  },
};

export const ForPaintComponents = memo(() => (
  <>
    <h3>
      <Progress step="PAINT" /> For paint components
    </h3>
    <LazySuspense fallback={<Result step="PAINT" isFallback hasSsr />}>
      <Async.ForPaintWithSSR />
    </LazySuspense>
    <LazySuspense fallback={<Result step="PAINT" isFallback />}>
      <Async.ForPaintWithoutSSR />
    </LazySuspense>
  </>
));
