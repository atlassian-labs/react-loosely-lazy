import React from 'react';
import { LazySuspense } from 'react-loosely-lazy';

// @ts-expect-error fallback prop is missing
<LazySuspense />;

// @ts-expect-error fallback prop is missing
<LazySuspense>children</LazySuspense>;

<LazySuspense fallback={<div />} />;

<LazySuspense fallback={<div />}>children</LazySuspense>;
