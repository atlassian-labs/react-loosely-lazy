# Preloading
## Server
Both preloading and prefetching is supported on the server by:

1. Integrating the [`react-loosely-lazy/webpack-plugin`](tooling/webpack-plugin) with your webpack configuration 
2. Providing the resulting manifest in [`init#manifest`](api/init?id=manifest) to generate dynamic links, and static links (*optional*)

### Generating the manifest
The manifest can be generated on either the client or server:

```javascript
import { ReactLooselyLazyPlugin } from 'react-loosely-lazy/webpack-plugin';

export default {
  // ...
  plugins: [
    new ReactLooselyLazyPlugin({ filename: 'lazy-manifest.json' }),
  ],
};
```

### Providing the manifest
Regardless of whether the manifest was created on the client or server, the asset will need to be provided to [`init`](api/init) before rendering the main application. The next example demonstrates a simple implementation, if the asset was available on the server:

```jsx
import { renderToString } from 'react-dom/server'
import LooselyLazy, { MODE } from 'react-loosely-lazy';

import { App } from './app'
import manifest from './lazy-manifest.json';

LooselyLazy.init({
  crossOrigin: 'anonymous',
  manifest,
  mode: MODE.RENDER,
});

const html = renderToString(<App />);
```

### Dynamic links
Once the manifest is initialised, preload and prefetch links will be created on the fly by default. This is due to the `link` elements being inlined with the `lazyForPaint` and `lazyAfterPaint` components, generating a server markup like so:

```html
<input data-lazy-begin="spqux7" type="hidden" />
<link 
  as="script" 
  crossorigin="anonymous" 
  href="https://cdn.com/assets/async-foo.js" 
  rel="preload"
/>
<div class="foo"></div>
<input data-lazy-end="spqux7" type="hidden" />
```

Since the dynamic links are rendered in the React root, the performance will always be slower than if they were emitted earlier in the document. Although this performance implication exists, this approach removes the need for configuration or tooling entirely. Moreover, this implementation introduces a positive side effect: components that are rendered conditionally via some state, or API, will be preloaded or prefetched when they could not have previously.

> **Note**
>
> The default mechanism for preloading and prefetching will render the `link` elements in the React root, which is typically in the [`Document#body`](https://developer.mozilla.org/en-US/docs/Web/API/Document/body)

### Static links
It is possible to render the links statically in the [`Document#head`](https://developer.mozilla.org/en-US/docs/Web/API/Document/head) by retrieving the necessary assets through [`LazyComponent#getAssetUrls`](api/lazy-component?id=getasseturls) or [`getAssetUrlsFromId`](api/get-asset-urls-from-id).

To generate static links in single-page applications, a mapping between the matched route and its lazy component dependencies, needs to be available in a static context. This mapping can either be specified manually or generated via some custom automation.

<div class="alert--warning">

> ️**Warning**
>
> Rendering static preload and prefetch links requires either manual configuration or custom tooling

</div>

#### Manual configuration
Manually defining the lazy components to preload or prefetch is only possible when your application has a static routes list. In this case, we can define a custom `preload` and `prefetch` key that comprise lazy components:

```jsx
import { lazyForPaint } from 'react-loosely-lazy';

const Foo = lazyForPaint(() => import('./foo'));

const fooRoute = {
  path: '/foo',
  component: Foo,
  prefetch: [],
  preload: [Foo],
};

export const routes = [fooRoute];
```

Now, the assets can be obtained after route matching, and either rendered or flushed to the document head.

```jsx
import LooselyLazy, { MODE } from 'react-loosely-lazy';
import { matchRoute } from 'router';

import manifest from './lazy-manifest.json';
import { routes } from './routes';

LooselyLazy.init({
  crossOrigin: 'anonymous',
  manifest,
  mode: MODE.RENDER,
});

const route = matchRoute(routes, pathname, search);
const prefetch = route.prefetch.map((prefetch => prefetch.getAssetUrls()));
const preloads = route.preloads.map((preload => preload.getAssetUrls()));
```

#### Automation
If your application utilises [`react-router`](https://github.com/ReactTraining/react-router) or a similar API, then it should be possible to extract the code-split route component with [guess-parser](https://github.com/guess-js/guess/tree/master/packages/guess-parser). However, this will not locate lazy components that are rendered after the matched route component.

## Client
On the client, `lazyAfterPaint` components are automatically prefetched when they are rendered in the paint phase. This behaviour reduces the need to manually preload components on the critical path, leaving components that are waterfall loaded or rendered conditionally (e.g. from a user-interaction), to be handled.

Otherwise, components can be preloaded manually on the client by calling the `preload` method exposed on the [`LazyComponent`](api/lazy-component). It automatically determines which priority (preload, or prefetch) to use based on the component loading phase, and applies a variety of loading strategies internally.

> **Note**
>
> * After paint components are automatically prefetched when they are rendered
> * The internal preloading strategies remove the need to initialise the manifest on the client for webpack based applications

Preloading should adhere to the best-practices set out by the React team, in particular the [render-as-you-fetch](https://reactjs.org/docs/concurrent-mode-suspense.html#approach-3-render-as-you-fetch-using-suspense) pattern. Below, we explore some different ways to preload a lazy component, and discuss whether the pattern is recommended.

### Preloading in module scope 
The lazy component can be preloaded in module scope, though this is not a recommended pattern since it introduces a negative side effect.

```jsx
// 👎 Preloading the component in module scope is not recommended

import { lazyForPaint } from 'react-loosely-lazy';

const Foo = lazyForPaint(() => import('./foo'));

Foo.preload();
```

More specifically, when the file is evaluated it will also begin to preload the assets. This often results in the assets being preloaded too early or unnecessarily, and may potentially block the critical path when the [loader fallback](api/lazy-component?id=preloadargs) is used.

<div class="alert--warning">

> **Warning**
>
> Preloading components in the module scope may block the critical path

</div>

### Preloading on component mount
Another technique is to preload a component, that may be rendered soon, when another component mounts. Usually this will correspond to preloading a child component, when the parent component mounts.

Because the side effect is contained to a component, this is an improvement over preloading in the module scope. However, this pattern is generally not recommended as the component may be unnecessarily preloaded. This is especially the case for conditionally rendered components, as shown in the below example:

```jsx
// 👎 Preloading a component on mount is not recommended

import { useEffect, useState } from 'react';
import { lazy } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazy(() => import('./foo'));

const App = () => {
  const [showFoo, setShowFoo] = useState(false);
  
  useEffect(() => {
    Foo.preload();
  }, []);
  
  return (
    <main>
      <button onClick={() => setShowFoo(true)}>
        Load
      </button>
      {showFoo && (
        <LazySuspense fallback={<Skeleton />}>
          <Foo />
        </LazySuspense>
      )}    
    </main>
  );
};
```

We can see that `Foo` is only loaded when the user interacts with the button. However, this may never occur, and therefore the assets to load the component are unnecessarily prefetched wasting the user's bandwidth.

### Preloading in an event handler
Instead of preloading the component on mount, we can take it a step further and move the logic into an event handler (e.g. click, hover, page transition, etc). This establishes a clear lifecycle, and relationship between the user action and outcome: when the user hovers on the loading button, we will preload the resources and then later render the component.

```jsx
// 👍 Preloading the component in an event handler is recommended

import { useState } from 'react';
import { lazy } from 'react-loosely-lazy';
import { Skeleton } from './skeleton';

const Foo = lazy(() => import('./foo'));

const App = () => {
  const [showFoo, setShowFoo] = useState(false);
  
  const onHover = () => {
    Foo.preload();
  };
  
  const onClick = () => {
    setShowFoo(true);
  };

  return (
    <main>
      <button onClick={onClick} onHover={onHover}>
        Load
      </button>
      {showFoo && (
        <LazySuspense fallback={<Skeleton />}>
          <Foo />
        </LazySuspense>
      )}
    </main>
  );
};
```

This approach to preloading is considered best-practice as it uses the [render-as-you-fetch](https://reactjs.org/docs/concurrent-mode-suspense.html#approach-3-render-as-you-fetch-using-suspense) paradigm, because we:

1. Start loading the `Foo` component before rendering it
2. Suspend the component when it is not ready, and render its `Skeleton` fallback
3. Render the `Foo` component when it is ready

<div class="alert--tip">

> **Tip**
> 
> Preloading in an event handler is considered best-practice

</div>

## Resources
* 📄 [Suspense for data fetching](https://reactjs.org/docs/concurrent-mode-suspense.html#approach-3-render-as-you-fetch-using-suspense)
* 📹 [Data fetching with Suspense in Relay: Implementing render-as-you-fetch](https://youtu.be/Tl0S7QkxFE4?t=1499)
* 📄 [Relay queries using render-as-you-fetch](https://relay.dev/docs/next/guided-tour/rendering/queries)
