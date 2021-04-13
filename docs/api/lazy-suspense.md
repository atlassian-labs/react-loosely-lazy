# `<LazySuspense />`
This is a proxy to the [`React#Suspense`](https://reactjs.org/docs/react-api.html#reactsuspense) component, that adds basic [server-side rendering](guides/server-side-rendering) support.

Please reference the official [Suspense for Data Fetching (Experimental)](https://reactjs.org/docs/concurrent-mode-suspense.html) and [Code splitting](https://reactjs.org/docs/code-splitting.html#reactlazy) pages for more information on how to use this component.

If you do not plan on using server-side rendering in your application, then you may opt to use `Suspense` directly. 

<div class="alert--warning">

> ️**Warning**
>
> When React adds support for `Suspense` on the server, `LazySuspense` should be superseded and will eventually be deprecated and removed

</div>

## Example
```jsx
import { LazySuspense, lazyForPaint } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';
import { Spinner } from './spinner';

const Component = lazyForPaint(() => import('./foo'));

const App = () => (
  <>
    <LazySuspense fallback={null}>
      <Component />
    </LazySuspense>

    <LazySuspense fallback="Loading...">
      <Component />
    </LazySuspense>

    <LazySuspense fallback={<Skeleton />}>
      <Component />
    </LazySuspense>

    <LazySuspense fallback={<Spinner />}>
      <Component />
    </LazySuspense>
  </>
);
```

## Props
### `children?`
`ReactNode`

The child components to render, which should include a [`LazyComponent`](api/lazy-component) to enable server-side rendering

---

### `fallback`
`NonNullable<ReactNode> | null`

A fallback react tree to show when a `Suspense` child suspends, which generally maps to a loading state
