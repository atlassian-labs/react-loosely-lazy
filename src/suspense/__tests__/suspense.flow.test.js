// @flow strict

import React from 'react';
import { LazySuspense } from 'react-loosely-lazy';

// $FlowExpectedError[prop-missing] fallback prop is missing
<LazySuspense />;

// $FlowExpectedError[prop-missing] fallback prop is missing
<LazySuspense>children</LazySuspense>;

<LazySuspense fallback={<div />} />;

<LazySuspense fallback={<div />}>children</LazySuspense>;
