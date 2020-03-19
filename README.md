<h1 align="center">react-loosely-lazy</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square"></a>
  <a href="CONTRIBUTING"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square"></a>
</p>
<!-- UNCOMMENT ONCE WE HAVE 	THESE, CONVERT TO A TAGS AND MOVE INTO P TAG ABOVE -->
<!--[![npm](https://img.shields.io/npm/v/react-loosely-lazy.svg)](https://www.npmjs.com/package/react-loosely-lazy)-->
<!--[![npm bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/react-loosely-lazy.svg)](https://bundlephobia.com/result?p=react-loosely-lazy)-->
<!--[![CircleCI](https://circleci.com/gh/atlassian/react-loosely-lazy.svg?style=shield&circle-token=xxx)](https://circleci.com/gh/atlassian/react-loosely-lazy)-->
<!--[![codecov](https://codecov.io/gh/atlassian/react-loosely-lazy/branch/master/graph/badge.svg)](https://codecov.io/gh/atlassian/react-loosely-lazy)-->


A future focused async component loading library for React. Comes packed with loading phases to enable fine-grained performance optimisations. 

## Why?

Today, React's native solution for asynchronously loading components, [`React.lazy`](https://reactjs.org/docs/code-splitting.html#reactlazy), does not work on the server. To get around this, developers have had to invent their own solutions to the problem such as `react-loadable` and `loadable-components`. These libraries however will not be compatible with `Suspense` out of the box and their APIs are quite different to the direction the React team are taking. It's also clear that this has become such a core part of building React apps at scale that it makes sense to rely on React to fill this requirement rather than third party libraries.

In addition to this we have to consider that, certainly from a performance point of view, not all components are created equal. It does not make sense to load components which are **required** for your user's first meaningful paint at the same time as those which are not. Doing so will impact your user's experience negatively. Likewise it is best to be able to opt-out of SSR for a component if you know that this will delay response times from the server significantly or if the component will not be able to be rendered in your Node environment.

React Loosely Lazy solves both of these problems with a server side compatible API that looks just like `Suspense`, while also providing an opt-in, phase based loading mechanism.

## Features

- Same code on server and client, handling SSR transparently
- Loading priority support via phases
- Customisable deferred loading and phases definition
- Preloading support
- Works with both `React.render()` and `React.hydrate()`

## Usage 


```js
import { lazyForPaint, LazySuspense } from 'react-loosely-lazy';

const MyAsyncComponent = lazyForPaint(() => import('./MyComponent'));
const Loading = () => <div>loading...</div>;
const App = () => (
  <LazySuspense fallback={Loading}>
    <AsyncMyComponent />
  </LazySuspense>
);
```

## Installation

```sh
npm i react-loosely-lazy
# or
yarn add react-loosely-lazy
```

## Documentation

### Basic use case: SSR + async loading of a component required for the first meaningful paint

```js
import { lazyForPaint, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazyForPaint(() => import('./MyComponent'));
const App = () => (
  <LazySuspense fallback="...">
    <AsyncMyComponent />
  </LazySuspense>
);
```

### No SSR use case: Fallback on SSR + async loading the component on the client

```js
import { lazyForAfterPaint, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazyForAfterPaint(() => import('./MyComponent'), {
  ssr: false,
})
const App = () => (
  <LazySuspense fallback={<MyComponentSkeleton />}>
    <AsyncMyComponent />
  </LazySuspense>
);
```

### Phase loading use case: SSR + specific phase loading

```js
import { lazyForAfterPaint, useLazyPhase, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazyForAfterPaint(() => import('./MyComponent'));

const App = () => {
  const { startNextPhase } = useLazyPhase();
  // eg start loading MyComponent after the app is mounted
  useEffect(() => {
    startNextPhase();
  }, [startNextPhase]);
  
  return (
    <LazySuspense fallback="...">
      	<AsyncMyComponent />
    </LazySuspense>
  );
};
```

### Trigger loading use case: No SSR & loading on user iteraction

```js
import { lazy, LazyWait, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazy(() => import('./MyComponent'));
const App = () => {
  const [shouldLoad, setLoad] = useState(false);

  return (
    <>
      <button onClick={() => setLoad(true)}>Load</button>
      <LazyWait until={shouldLoad}>
        <LazySuspense fallback={shouldLoad ? <MyComponentSkeleton /> : null}>
          <AsyncMyComponent />
        </LazySuspense>
      </LazyWait>
    </>
  );
};
```

## Examples

See `react-loosely-lazy` in action: run `npm run start` and then go and check: `http://localhost:8080/`


## Contributing

Thank you for considering a contribution to `react-loosely-lazy`! Before doing so, please make sure to read our [contribution guidelines](CONTRIBUTING). 

## Development

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.


[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://www.atlassian.com)
