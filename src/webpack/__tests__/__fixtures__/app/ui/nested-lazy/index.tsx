import React from 'react';
import { lazy } from 'react-loosely-lazy';

export const InnerLazyNested = lazy(() =>
  import(/* webpackChunkName: "async-inner-nested-lazy" */ './main')
);

export const NestedLazy = () => (
  <div>
    Nested Lazy
    <InnerLazyNested />
  </div>
);

export default NestedLazy;
