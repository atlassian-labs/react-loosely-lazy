# Examples
## First meaningful paint
`lazyForPaint` is designed for components that are rendered on the critical path, that should be loaded and made interactive as soon as possible.

```jsx
import { LazySuspense, lazyForPaint } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazyForPaint(() => import('./foo'));

const App = () => (
  <LazySuspense fallback={<Skeleton />}>
    <Foo />
  </LazySuspense>
);
```

## Deferred loading
`lazyAfterPaint` creates components that load during a secondary phase, which is manually started by the consumer through the [`useLazyPhase`](api/use-lazy-phase) API.

```jsx
import { LazySuspense, lazyAfterPaint, useLazyPhase } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazyAfterPaint(() => import('./foo'));

const App = () => {
  const { startNextPhase } = useLazyPhase();
  // e.g. start loading Foo after the app has mounted
  useEffect(() => {
    startNextPhase();
  }, [startNextPhase]);

  return (
    <LazySuspense fallback={<Skeleton />}>
      <Foo />
    </LazySuspense>
  );
};
```

## Loading on user interaction
`lazy` should be used to define components that load only when rendered.

If used in conjunction with `LazyWait`, it allows the dynamic import to be requested only when a specific condition is truthy. This behaviour enables consumers to dynamically load and render components without breaking CSS animations.

```jsx
import { useState } from 'react';
import { LazySuspense, LazyWait, lazy } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazy(() => import('./foo'));

const App = () => {
  const [shouldLoad, setShouldLoad] = useState(false);

  return (
    <>
      <button onClick={() => setShouldLoad(true)}>Load</button>

      <LazyWait until={shouldLoad}>
        <LazySuspense fallback={shouldLoad ? <Skeleton /> : null}>
          <Foo />
        </LazySuspense>
      </LazyWait>
    </>
  );
};
```

## Server-side rendering
By default, `lazyForPaint` and `lazyAfterPaint` components are rendered on both the client and server, while `lazy` components only render on the client.

This behaviour can be overridden by specifying the `ssr` option when constructing the lazy component.

```jsx
import { lazy, lazyAfterPaint, lazyForPaint } from 'react-loosely-lazy';

const Foo = lazyForPaint(() => import('./foo'), {
  ssr: false,
});

const Bar = lazyAfterPaint(() => import('./bar'), {
  ssr: false,
});

const Baz = lazy(() => import('./baz'), {
  ssr: true,
});
```
