import { lazyForPaint, lazy } from 'react-loosely-lazy';

// Simple import
const Component1 = lazyForPaint(() => import('./Component1'));

// Named import with .then()
const Component2 = lazyForPaint(() => 
  import('react').then(({ Component }) => Component)
);

// Complex chained transformations
const Component3 = lazyForPaint(() =>
  import('./utils')
    .then(({ helper }) => helper)
    .then(fn => fn())
    .then(result => result)
);

// No-SSR component
const Component4 = lazy(() => import('./Component4'));