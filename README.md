<p align="center">
  <img src="https://user-images.githubusercontent.com/84136/83958564-9f660900-a8b6-11ea-97d8-c93fecebfeed.png" alt="react-loosely-lazy logo" height="150" />
</p>
<h1 align="center">react-loosely-lazy</h1>
<p align="center">
  <a href="https://www.npmjs.com/package/react-loosely-lazy"><img src="https://img.shields.io/npm/v/react-loosely-lazy.svg"></a>
  <a href="https://bundlephobia.com/result?p=react-loosely-lazy"><img src="https://img.shields.io/bundlephobia/minzip/react-loosely-lazy.svg" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg"></a>
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" /></a>
</p>

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
- Babel plugin that works on both client and server to ensure cleaner code and synchronous imports in Node
- Webpack plugin to generate chunks manifest and load them ahead of time in SSR

## Installation

```sh
npm i react-loosely-lazy
# or
yarn add react-loosely-lazy
```

## Usage

### In your app

```js
import { lazyForPaint, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazyForPaint(() => import('./MyComponent'));
const Loading = () => <div>loading...</div>;
const App = () => (
  <LazySuspense fallback={Loading}>
    <AsyncMyComponent />
  </LazySuspense>
);
```

### Babel configuration

Add to your Babel config (or webpack babel-loader config) `react-loosely-lazy/babel-plugin`.
The plugin is meant to generate different outputs between client builds and server build, so on the client Babel config you have to specify `{ client: true }` otherwise generated imports will not be async.

## Documentation

### Basic use case: async loading of a component required for the first meaningful paint

`lazyForPaint` defines components that are critical and should be loaded as soon as possible. By default, they are also rendered on SSR.

```js
import { lazyForPaint, LazySuspense } from 'react-loosely-lazy';

// by default this will be rendered in SSR
const AsyncMyComponent = lazyForPaint(() => import('./MyComponent'));
// but you can skip SSR and render just the fallback by configuring ssr: false
const AsyncMyComponent = lazyForPaint(() => import('./MyComponent'), {
  ssr: false,
});

const App = () => (
  <LazySuspense fallback="...">
    <AsyncMyComponent />
  </LazySuspense>
);
```

### Phase loading use case: deferred loading

`lazyAfterPaint` defines components that should load during a secondary phase that should be manually started by the consumers. By default, these components are also rendered on SSR.

```js
import { lazyAfterPaint, useLazyPhase, LazySuspense } from 'react-loosely-lazy';

const AsyncMyComponent = lazyAfterPaint(() => import('./MyComponent'));

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

### Trigger loading use case: loading on user iteraction

`lazy` should be used to define components that should be loaded only when rendered. If used in conjunction with `LazyWait`, it allows the async code to be requested only when a specific condition is thruty. That is great to dynamically load and render components without breaking CSS animations for instance.

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

## Playground

See `react-loosely-lazy` in action: run `npm run start` and then go and check: `http://localhost:8080/`

## Contributing

Thank you for considering a contribution to `react-loosely-lazy`! Before doing so, please make sure to read our [contribution guidelines](CONTRIBUTING.md).

## Development

To test your changes you can run the examples (with `npm run start`).
Also, make sure you run `npm run preversion` before creating you PR so you will double check that linting, types and tests are fine.

## License

Copyright (c) 2020 Atlassian and others.
Apache 2.0 licensed, see [LICENSE](LICENSE) file.

[![With ❤️ from Atlassian](https://raw.githubusercontent.com/atlassian-internal/oss-assets/master/banner-cheers-light.png)](https://www.atlassian.com)
