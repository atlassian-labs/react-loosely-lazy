// @flow strict

import React from 'react';
import { LazySuspense } from 'react-loosely-lazy';

// $FlowExpectedError fallback prop is missing
<LazySuspense />;

// $FlowExpectedError fallback prop is missing
<LazySuspense>children</LazySuspense>;

<LazySuspense fallback={<div />} />;

<LazySuspense fallback={<div />}>children</LazySuspense>;
