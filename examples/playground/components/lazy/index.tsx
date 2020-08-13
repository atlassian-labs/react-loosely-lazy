import React, { memo } from 'react';
import { lazy, LazySuspense } from 'react-loosely-lazy';

import { controlLoad } from '../../utils';
import { Result, Progress } from '../result';

const Async: any = {};

export const buildLazyComponents = {
  server: () => {
    Async.LazyWithoutSSR = lazy(() => import('./without-ssr'), {
      moduleId: './lazy/without-ssr',
      ssr: false,
    });
  },
  client: () => {
    Async.LazyWithoutSSR = lazy(
      () => import('./without-ssr').then(controlLoad),
      { moduleId: './lazy/without-ssr', ssr: false }
    );
  },
};

export const LazyComponents = memo(() => (
  <>
    <h3>
      <Progress step="AF" /> Lazy components
    </h3>
    <LazySuspense fallback={<Result step="AF" isFallback />}>
      <Async.LazyWithoutSSR />
    </LazySuspense>
  </>
));
